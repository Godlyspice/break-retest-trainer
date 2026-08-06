-- Futures Academy v4.4
-- Store the preferred display name supplied during account signup.

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  preferred_name text;
begin
  preferred_name := regexp_replace(
    trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')),
    '\s+',
    ' ',
    'g'
  );

  if char_length(preferred_name) < 3
     or char_length(preferred_name) > 30
     or preferred_name !~ '^[A-Za-z0-9 _-]+$' then
    preferred_name := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (
    id,
    email,
    display_name,
    role,
    premium,
    xp,
    streak,
    credits,
    reputation
  )
  values (
    new.id,
    new.email,
    preferred_name,
    'user',
    false,
    0,
    0,
    0,
    0
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = case
      when public.profiles.display_name is null
        or trim(public.profiles.display_name) = ''
      then excluded.display_name
      else public.profiles.display_name
    end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

commit;
