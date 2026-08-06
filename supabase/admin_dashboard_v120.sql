-- Futures Academy v1.2.0
-- Owner Console expansion and modular-admin migration.
-- Run once after admin_dashboard_v112.sql.

begin;

alter table public.profiles
  add column if not exists premium_expires_at timestamptz,
  add column if not exists badges text[] not null default '{}'::text[],
  add column if not exists profile_backgrounds text[] not null default '{}'::text[];

-- Expired temporary premium memberships are treated as inactive.
create or replace function public.owner_list_users(
  search_text text default null,
  page_limit integer default 50,
  page_offset integer default 0
)
returns table (
  id uuid,
  email text,
  display_name text,
  role public.app_role,
  premium boolean,
  premium_expires_at timestamptz,
  xp integer,
  credits integer,
  reputation integer,
  streak integer,
  banned boolean,
  suspended_until timestamptz,
  badges text[],
  profile_backgrounds text[],
  created_at timestamptz,
  last_active_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'Owner access required';
  end if;

  return query
  select
    p.id,
    p.email,
    p.display_name,
    p.role,
    (
      p.premium
      and (p.premium_expires_at is null or p.premium_expires_at > now())
    ) as premium,
    p.premium_expires_at,
    p.xp,
    p.credits,
    p.reputation,
    p.streak,
    p.banned,
    p.suspended_until,
    p.badges,
    p.profile_backgrounds,
    p.created_at,
    p.last_active_at
  from public.profiles p
  where
    search_text is null
    or btrim(search_text) = ''
    or p.email ilike '%' || btrim(search_text) || '%'
    or coalesce(p.display_name, '') ilike '%' || btrim(search_text) || '%'
  order by p.created_at desc
  limit greatest(1, least(page_limit, 100))
  offset greatest(0, page_offset);
end;
$$;

revoke all on function public.owner_list_users(text, integer, integer)
from public, anon;
grant execute on function public.owner_list_users(text, integer, integer)
to authenticated;

create or replace function public.owner_platform_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_owner() then
    raise exception 'Owner access required';
  end if;

  select jsonb_build_object(
    'total_accounts', (select count(*) from public.profiles),
    'premium_users', (
      select count(*)
      from public.profiles
      where premium
        and (premium_expires_at is null or premium_expires_at > now())
    ),
    'banned_users', (
      select count(*) from public.profiles where banned
    ),
    'suspended_users', (
      select count(*)
      from public.profiles
      where suspended_until is not null and suspended_until > now()
    ),
    'active_24h', (
      select count(*)
      from public.profiles
      where last_active_at >= now() - interval '24 hours'
    ),
    'active_7d', (
      select count(*)
      from public.profiles
      where last_active_at >= now() - interval '7 days'
    ),
    'signups_today', (
      select count(*)
      from public.profiles
      where created_at >= date_trunc('day', now())
    ),
    'attempts_total', (select count(*) from public.attempts),
    'attempts_today', (
      select count(*)
      from public.attempts
      where created_at >= date_trunc('day', now())
    ),
    'average_accuracy', coalesce((
      select round(
        100.0 * count(*) filter (where correct) / nullif(count(*), 0),
        1
      )
      from public.attempts
    ), 0),
    'most_played_mode', (
      select scenario_type
      from public.attempts
      group by scenario_type
      order by count(*) desc
      limit 1
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.owner_platform_stats() from public, anon;
grant execute on function public.owner_platform_stats() to authenticated;

create or replace function public.owner_audit_log(row_limit integer default 100)
returns table (
  id bigint,
  actor_email text,
  target_email text,
  action text,
  details jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'Owner access required';
  end if;

  return query
  select
    log.id,
    actor.email,
    target.email,
    log.action,
    log.details,
    log.created_at
  from public.admin_audit_log log
  join public.profiles actor on actor.id = log.actor_user_id
  left join public.profiles target on target.id = log.target_user_id
  order by log.created_at desc
  limit greatest(1, least(row_limit, 500));
end;
$$;

revoke all on function public.owner_audit_log(integer) from public, anon;
grant execute on function public.owner_audit_log(integer) to authenticated;

create or replace function public.owner_manage_user(
  target_user_id uuid,
  requested_action text,
  requested_value text default null,
  requested_amount integer default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.profiles;
  normalized_action text := lower(btrim(requested_action));
  amount integer := coalesce(requested_amount, 0);
begin
  if not public.is_owner() then
    raise exception 'Owner access required';
  end if;

  select * into target
  from public.profiles
  where id = target_user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  if target_user_id = auth.uid()
     and normalized_action in ('ban', 'suspend', 'set_role') then
    if normalized_action <> 'set_role' or requested_value <> 'owner' then
      raise exception 'You cannot remove or restrict your own owner access';
    end if;
  end if;

  case normalized_action
    when 'set_role' then
      if requested_value not in ('user','moderator','admin','owner') then
        raise exception 'Invalid role';
      end if;
      update public.profiles
      set role = requested_value::public.app_role,
          updated_at = now()
      where id = target_user_id;

    when 'set_premium' then
      update public.profiles
      set premium = coalesce(requested_value::boolean, false),
          premium_expires_at = null,
          updated_at = now()
      where id = target_user_id;

    when 'grant_premium_days' then
      if amount < 1 or amount > 3650 then
        raise exception 'Premium duration must be between 1 and 3650 days';
      end if;
      update public.profiles
      set premium = true,
          premium_expires_at =
            greatest(coalesce(premium_expires_at, now()), now())
            + make_interval(days => amount),
          updated_at = now()
      where id = target_user_id;

    when 'clear_premium_expiration' then
      update public.profiles
      set premium = true,
          premium_expires_at = null,
          updated_at = now()
      where id = target_user_id;

    when 'grant_badge' then
      if requested_value is null or btrim(requested_value) = '' then
        raise exception 'Badge is required';
      end if;
      update public.profiles
      set badges = array(
        select distinct value
        from unnest(badges || requested_value) as value
      ),
      updated_at = now()
      where id = target_user_id;

    when 'grant_background' then
      if requested_value is null or btrim(requested_value) = '' then
        raise exception 'Background is required';
      end if;
      update public.profiles
      set profile_backgrounds = array(
        select distinct value
        from unnest(profile_backgrounds || requested_value) as value
      ),
      updated_at = now()
      where id = target_user_id;

    when 'ban' then
      update public.profiles
      set banned = true,
          suspended_until = null,
          updated_at = now()
      where id = target_user_id;

    when 'unban' then
      update public.profiles
      set banned = false,
          updated_at = now()
      where id = target_user_id;

    when 'suspend' then
      if amount < 1 or amount > 3650 then
        raise exception 'Suspension must be between 1 and 3650 days';
      end if;
      update public.profiles
      set suspended_until = now() + make_interval(days => amount),
          updated_at = now()
      where id = target_user_id;

    when 'unsuspend' then
      update public.profiles
      set suspended_until = null,
          updated_at = now()
      where id = target_user_id;

    when 'grant_xp' then
      if amount = 0 or abs(amount) > 1000000 then
        raise exception 'Invalid XP amount';
      end if;
      update public.profiles
      set xp = greatest(0, xp + amount),
          updated_at = now()
      where id = target_user_id;

    when 'grant_credits' then
      if amount = 0 or abs(amount) > 1000000 then
        raise exception 'Invalid credits amount';
      end if;
      update public.profiles
      set credits = greatest(0, credits + amount),
          updated_at = now()
      where id = target_user_id;

    when 'grant_reputation' then
      if amount = 0 or abs(amount) > 1000000 then
        raise exception 'Invalid reputation amount';
      end if;
      update public.profiles
      set reputation = greatest(0, reputation + amount),
          updated_at = now()
      where id = target_user_id;

    else
      raise exception 'Unsupported owner action';
  end case;

  insert into public.admin_audit_log(
    actor_user_id,
    target_user_id,
    action,
    details
  )
  values (
    auth.uid(),
    target_user_id,
    normalized_action,
    jsonb_build_object(
      'value', requested_value,
      'amount', requested_amount
    )
  );

  select * into target
  from public.profiles
  where id = target_user_id;

  return target;
end;
$$;

revoke all on function public.owner_manage_user(uuid, text, text, integer)
from public, anon;
grant execute on function public.owner_manage_user(uuid, text, text, integer)
to authenticated;

commit;
