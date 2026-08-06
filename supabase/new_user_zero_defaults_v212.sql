-- Futures Academy v2.1.2
-- Fresh defaults for every newly registered Academy member.
-- Existing profile values are not changed.

begin;

alter table public.profiles
  add column if not exists xp integer not null default 0,
  add column if not exists streak integer not null default 0,
  add column if not exists credits integer not null default 0,
  add column if not exists reputation integer not null default 0;

alter table public.profiles
  alter column xp set default 0,
  alter column streak set default 0,
  alter column credits set default 0,
  alter column reputation set default 0;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(new.email, '@', 1)
    ),
    'user',
    false,
    0,
    0,
    0,
    0
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Recreate only if needed, while keeping the trigger name predictable.
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

commit;
