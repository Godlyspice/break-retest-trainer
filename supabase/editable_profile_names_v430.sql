-- Futures Academy v4.3
-- Allow authenticated members to update their own public display name.

begin;

create or replace function public.update_my_display_name(
  new_display_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  cleaned_name := regexp_replace(trim(new_display_name), '\s+', ' ', 'g');

  if char_length(cleaned_name) < 3 or char_length(cleaned_name) > 30 then
    raise exception 'Display name must contain between 3 and 30 characters';
  end if;

  if cleaned_name !~ '^[A-Za-z0-9 _-]+$' then
    raise exception 'Use letters, numbers, spaces, underscores, or hyphens only';
  end if;

  update public.profiles
  set
    display_name = cleaned_name,
    updated_at = now()
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  return cleaned_name;
end;
$$;

revoke all on function public.update_my_display_name(text)
from public, anon;

grant execute on function public.update_my_display_name(text)
to authenticated;

commit;
