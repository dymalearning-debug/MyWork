-- Secrets of the database per project (docs/launch.md, "Séparer le développement de la production").
--
-- The hashes of BILLING_SECRET and BOOKING_EMAILS_SECRET were written in the migrations, so the
-- development and production projects shared the same secrets. They now live in a private table,
-- set in each project by hand (SQL editor or `npx supabase db query --linked`), never in a
-- migration. Several hashes may be valid for one secret at once: a new secret is added, set in
-- Vercel, then the old one is deleted, without any interruption.
--
-- This migration keeps the current hashes, so nothing changes until a project gets its own.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.secret_hashes (
  name text not null check (name in ('billing', 'booking_emails')),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (name, sha256)
);
revoke all on table private.secret_hashes from public, anon, authenticated;

insert into private.secret_hashes (name, sha256) values
  ('booking_emails', '09ebcb5820c098ea9da4855be2f763b0317cebf2ebaa644c581929ea1645a327'),
  ('billing', 'd4170bb35bcb8d092b63f8518ee68b74e45696b2c23e022bdf3215e300e118c5');

create or replace function private.is_secret(secret_name text, secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1 from private.secret_hashes h
      where h.name = secret_name and h.sha256 = encode(extensions.digest(secret, 'sha256'), 'hex')
    ),
    false
  );
$$;
revoke execute on function private.is_secret(text, text) from public, anon, authenticated;

-- Same signatures as before: the functions that call them do not change.
create or replace function public.is_booking_emails_secret(secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_secret('booking_emails', secret);
$$;
revoke execute on function public.is_booking_emails_secret(text) from public, anon, authenticated;

create or replace function public.is_billing_secret(secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_secret('billing', secret);
$$;
revoke execute on function public.is_billing_secret(text) from public, anon, authenticated;
