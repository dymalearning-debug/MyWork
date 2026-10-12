-- Settings, page "Profil" (see docs/settings.md): first and last name, the public handle the user
-- can change, and the deletion of the account.

-- First and last name, optional. Filled from the Google name when the account is created;
-- left empty for an account created with an email address.
alter table public.profiles
  add column first_name text,
  add column last_name text;

alter table public.profiles
  add constraint profiles_first_name_length check (char_length(first_name) <= 100),
  add constraint profiles_last_name_length check (char_length(last_name) <= 100);

-- First and last name from the account data Supabase Auth received from Google: given_name and
-- family_name when they are there, otherwise the first word of the full name as first name and
-- the rest as last name ("Jean-Pierre Dupont" gives "Jean-Pierre" and "Dupont").
create function public.split_full_name(metadata jsonb, out first_name text, out last_name text)
language plpgsql
immutable
set search_path = ''
as $$
declare
  full_name text := regexp_replace(btrim(coalesce(metadata ->> 'full_name', metadata ->> 'name', '')), '\s+', ' ', 'g');
begin
  first_name := nullif(btrim(coalesce(metadata ->> 'given_name', '')), '');
  last_name := nullif(btrim(coalesce(metadata ->> 'family_name', '')), '');
  if first_name is null and last_name is null and full_name <> '' then
    first_name := split_part(full_name, ' ', 1);
    last_name := nullif(btrim(substr(full_name, char_length(first_name) + 1)), '');
  end if;
  first_name := left(first_name, 100);
  last_name := left(last_name, 100);
end;
$$;

-- Existing accounts: names from Google, when the account came from Google.
update public.profiles p
set first_name = n.first_name, last_name = n.last_name
from auth.users u, lateral public.split_full_name(u.raw_user_meta_data) n
where u.id = p.id;

-- New accounts: the profile is now created with the names too.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempts integer := 0;
  names record;
begin
  select * into names from public.split_full_name(new.raw_user_meta_data);
  loop
    begin
      insert into public.profiles (id, email, handle, first_name, last_name)
      values (
        new.id,
        new.email,
        public.build_handle(
          coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
          new.email
        ),
        names.first_name,
        names.last_name
      );
      return new;
    exception when unique_violation then
      -- Another account took the same handle at the same moment: build the next one.
      attempts := attempts + 1;
      if attempts >= 5 then
        raise;
      end if;
    end;
  end loop;
end;
$$;

-- A handle chosen in the Settings is never a reserved word. Checked here, since users cannot read
-- the reserved words; the format and the uniqueness are constraints of the table.
create function public.check_handle_not_reserved()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.reserved_handles where handle = new.handle) then
    raise exception 'handle_unavailable' using detail = format('"%s" is a reserved word.', new.handle);
  end if;
  return new;
end;
$$;

create trigger profiles_check_handle_not_reserved
  before update of handle on public.profiles
  for each row
  when (old.handle is distinct from new.handle)
  execute function public.check_handle_not_reserved();

-- Live check of the Settings, while the user types: is this handle free for them?
-- Reserved, or taken by another profile: false. The format is checked by the app and the table.
create function public.is_handle_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.reserved_handles where handle = candidate)
     and not exists (select 1 from public.profiles where handle = candidate and id <> (select auth.uid()));
$$;

-- What users can change on their own profile (RLS limits them to their own row):
-- the online switch (already granted), the names and the handle.
grant update (first_name, last_name, handle) on public.profiles to authenticated;

-- "Supprimer le compte": deletes the signed-in user's account. Everything that belongs to it goes
-- with it (on delete cascade): the profile, the sessions, the sign-in methods.
create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;

-- Nothing is callable through the API by default: only the live check and the deletion are
-- opened, to signed-in users.
revoke execute on function public.split_full_name(jsonb) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.check_handle_not_reserved() from public, anon, authenticated;
revoke execute on function public.is_handle_available(text) from public, anon, authenticated;
revoke execute on function public.delete_own_account() from public, anon, authenticated;
grant execute on function public.is_handle_available(text) to authenticated;
grant execute on function public.delete_own_account() to authenticated;
