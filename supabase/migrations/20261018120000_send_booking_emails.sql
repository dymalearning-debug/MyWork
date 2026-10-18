-- Sending the Rendez-vous emails with Resend (docs/booking.md, "E-mails").
--
-- The queue (booking_emails) stays closed to the API. The server takes the emails it has just
-- prepared through two functions that ask for the sending secret (BOOKING_EMAILS_SECRET, in
-- Vercel only): it never needs the Supabase secret key. Only the SHA-256 of the secret is
-- written here; to change the secret, change it in Vercel and its hash in a new migration.
--
-- States: pending (prepared) → sending (taken by the server) → sent, failed, or abandoned (never
-- sent: a test address, or the emails prepared before Resend).

alter table public.booking_emails drop constraint booking_emails_status_check;
alter table public.booking_emails add constraint booking_emails_status_check
  check (status in ('pending', 'sending', 'sent', 'failed', 'abandoned'));
alter table public.booking_emails add column error text;

create function public.is_booking_emails_secret(secret text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    encode(extensions.digest(secret, 'sha256'), 'hex') = '09ebcb5820c098ea9da4855be2f763b0317cebf2ebaa644c581929ea1645a327',
    false
  );
$$;

-- Takes the emails just prepared (pending, less than an hour old) and marks them "sending", so
-- that each is sent once. Returns what the server needs to render and send them.
create function public.claim_booking_emails(email_ids uuid[], secret text)
returns table (id uuid, booking_id uuid, template text, recipient text, data jsonb)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_booking_emails_secret(secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  update public.booking_emails e
  set status = 'sending'
  where e.id = any(email_ids) and e.status = 'pending' and e.created_at > now() - interval '1 hour'
  returning e.id, e.booking_id, e.template, e.recipient, e.data;
end;
$$;

-- The result of one email: sent, failed (with the error) or abandoned.
create function public.finish_booking_email(email_id uuid, result text, error text, secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_booking_emails_secret(secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if result not in ('sent', 'failed', 'abandoned') then
    raise exception 'invalid result' using errcode = '22023';
  end if;
  update public.booking_emails e
  set status = result,
    sent_at = case when result = 'sent' then now() end,
    error = left(finish_booking_email.error, 500)
  where e.id = email_id and e.status = 'sending';
end;
$$;

revoke execute on function public.is_booking_emails_secret(text) from public, anon, authenticated;
revoke execute on function public.claim_booking_emails(uuid[], text) from public;
revoke execute on function public.finish_booking_email(uuid, text, text, text) from public;
grant execute on function public.claim_booking_emails(uuid[], text) to anon, authenticated;
grant execute on function public.finish_booking_email(uuid, text, text, text) to anon, authenticated;

-- The emails prepared before Resend (test bookings): never sent.
update public.booking_emails set status = 'abandoned' where status = 'pending';
