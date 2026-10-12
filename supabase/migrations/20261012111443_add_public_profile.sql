-- Public profile (see docs/public-profile.md, "Identifiant public" and "Données"):
-- each profile gets a public handle, built here in the database when the account is created,
-- and an online switch, offline by default.

-- Words that can never be a handle: addresses of the app and generic names.
-- The only list: read by build_handle() below and, later, by the Settings.
-- An end-to-end test checks that every top-level address of the app is in it.
create table public.reserved_handles (
  handle text primary key
);

comment on table public.reserved_handles is 'Words that can never be a public profile handle.';

alter table public.reserved_handles enable row level security;
revoke all on public.reserved_handles from anon, authenticated;
grant select on public.reserved_handles to service_role;

insert into public.reserved_handles (handle) values
  -- Addresses of the app: folders of src/app/ and public/, files served at the root, the former /profile.
  ('app'), ('auth'), ('design'), ('login'), ('signup'), ('forgot-password'), ('reset-password'),
  ('link-expired'), ('profile'), ('brand'), ('icon'), ('apple-icon'), ('favicon'),
  ('opengraph-image'), ('twitter-image'), ('robots'), ('sitemap'), ('manifest'),
  -- Generic names, in English and in French.
  ('about'), ('account'), ('admin'), ('api'), ('assets'), ('billing'), ('blog'), ('contact'),
  ('dashboard'), ('docs'), ('help'), ('home'), ('legal'), ('logout'), ('pricing'), ('privacy'),
  ('register'), ('root'), ('settings'), ('signin'), ('static'), ('status'), ('support'), ('terms'),
  ('www'), ('mywork'), ('linku'),
  ('a-propos'), ('aide'), ('cgu'), ('cgv'), ('compte'), ('confidentialite'), ('connexion'),
  ('deconnexion'), ('inscription'), ('mentions-legales'), ('parametres'), ('tarifs');

-- The handle (unique, lowercase letters without accents, digits and dashes, 3 to 30 characters)
-- and the online switch.
alter table public.profiles
  add column handle text,
  add column is_online boolean not null default false;

alter table public.profiles
  add constraint profiles_handle_key unique (handle),
  add constraint profiles_handle_format check (
    handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(handle) between 3 and 30
  );

-- Accents are removed with the unaccent extension ("Inès" becomes "ines", "Œ" becomes "oe").
create extension if not exists unaccent with schema extensions;

-- Turns a name or the start of an email address into a handle: no accents, lowercase, a dash for
-- anything that is not a letter or a digit, at most max_length characters, cut between two words.
create function public.slugify_handle(input text, max_length integer default 30)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  slug text;
  cut text;
begin
  slug := lower(extensions.unaccent(coalesce(input, '')));
  slug := trim(both '-' from regexp_replace(slug, '[^a-z0-9]+', '-', 'g'));
  if char_length(slug) > max_length then
    cut := left(slug, max_length);
    -- Unless the cut already falls between two words, drop the last, unfinished word.
    -- A single word too long for the limit is cut where it is.
    if substr(slug, max_length + 1, 1) <> '-' and cut like '%-%' then
      cut := regexp_replace(cut, '-[^-]*$', '');
    end if;
    slug := trim(both '-' from cut);
  end if;
  return slug;
end;
$$;

-- A free handle for a new profile: from the Google name, else from the start of the email address
-- (what follows a "+" is ignored), else "profil". When it is taken or reserved: "-2", "-3"...
create function public.build_handle(full_name text, email text)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  base text;
  candidate text;
  suffix integer := 1;
begin
  base := public.slugify_handle(full_name);
  if char_length(base) < 3 then
    base := public.slugify_handle(split_part(split_part(coalesce(email, ''), '@', 1), '+', 1));
  end if;
  if char_length(base) < 3 then
    base := 'profil';
  end if;

  candidate := base;
  while exists (select 1 from public.profiles where handle = candidate)
     or exists (select 1 from public.reserved_handles where handle = candidate) loop
    suffix := suffix + 1;
    candidate := public.slugify_handle(base, 30 - char_length(suffix::text) - 1) || '-' || suffix;
  end loop;
  return candidate;
end;
$$;

-- Existing accounts get their handle, oldest first. The Google name is in the account data
-- that Supabase Auth received from Google.
do $$
declare
  account record;
begin
  for account in
    select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name') as full_name
    from public.profiles p
    join auth.users u on u.id = p.id
    order by u.created_at
  loop
    update public.profiles
    set handle = public.build_handle(account.full_name, account.email)
    where id = account.id;
  end loop;
end;
$$;

alter table public.profiles alter column handle set not null;

-- New accounts: the profile is now created with its handle.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempts integer := 0;
begin
  loop
    begin
      insert into public.profiles (id, email, handle)
      values (
        new.id,
        new.email,
        public.build_handle(
          coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
          new.email
        )
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

-- updated_at follows every change of a profile.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Only its owner can put a profile online or offline. The handle is not editable yet:
-- it will be with the Settings.
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant update (is_online) on public.profiles to authenticated;

-- Public read, open to anonymous visitors: only what the public page needs, never the email.
-- An online profile for everyone; an offline one for its owner only (preview of the public page).
create function public.get_public_profile(profile_handle text)
returns table (handle text, is_online boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.handle, p.is_online
  from public.profiles p
  where p.handle = profile_handle
    and (p.is_online or p.id = (select auth.uid()));
$$;

-- Nothing is callable through the API by default: only the public read is opened.
revoke execute on function public.slugify_handle(text, integer) from public, anon, authenticated;
revoke execute on function public.build_handle(text, text) from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;
