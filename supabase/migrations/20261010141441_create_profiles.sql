-- MyWork profile: one row per user, created automatically at sign-up (see docs/auth.md, "Données de l'utilisateur").
-- Supabase Auth keeps the account itself (auth.users); the app never writes there.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Copy of auth.users.email, kept in sync by the triggers below.
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'MyWork data for each user. One row per auth.users row.';

-- Row Level Security: each user reads only their own row.
-- Nothing is editable yet (the email follows Supabase Auth): update grants and policies come with
-- the first column users can change (name, photo...).
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- No table is exposed to the Data API by default on this project: grant access explicitly.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- Create the profile when an account is created (email and password, or Google).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the email up to date when it changes in Supabase Auth.
create function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email, updated_at = now() where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- These functions only run as triggers: nobody may call them through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
