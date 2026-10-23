-- Bookings only through the server (security audit of 2026-10-23).
--
-- book_public_slot was open to anonymous visitors through the API: a script could call it
-- directly with the public key and no ip_hash, without the limit of 10 bookings an hour, the trap
-- field or the checks of the form, and fill the calendars of every online profile. It now asks for
-- the secret of the Rendez-vous module (BOOKING_EMAILS_SECRET, server only, checked by
-- is_booking_emails_secret), like claim_booking_emails: only the Server Action
-- of the form can book. The rules are unchanged.

drop function public.book_public_slot(text, timestamptz, text, text, text, text, text, text, text);

create function public.book_public_slot(
  profile_handle text,
  slot_start timestamptz,
  guest_name text,
  guest_email text,
  guest_role text,
  guest_company text,
  guest_message text,
  guest_time_zone text,
  ip_hash text,
  secret text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner public.profiles;
  s public.booking_settings;
  local_start timestamp;
  local_day date;
  slot_minute integer;
  day_ranges jsonb;
  in_range boolean;
  booking public.bookings;
  owner_name text;
  email_ids uuid[];
  clean_name text := btrim(coalesce(guest_name, ''));
  clean_email text := lower(btrim(coalesce(guest_email, '')));
  clean_role text := nullif(btrim(coalesce(guest_role, '')), '');
  clean_company text := nullif(btrim(coalesce(guest_company, '')), '');
  clean_message text := btrim(coalesce(guest_message, ''));
  zone text := coalesce(nullif(guest_time_zone, ''), 'Europe/Paris');
begin
  if not public.is_booking_emails_secret(secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into owner from public.profiles where handle = profile_handle and is_online;
  if not found then
    return jsonb_build_object('status', 'closed');
  end if;
  -- One booking at a time per owner: the limit per day holds when two visitors book together.
  select * into s from public.booking_settings where user_id = owner.id and is_open for update;
  if not found then
    return jsonb_build_object('status', 'closed');
  end if;

  if slot_start is null or char_length(clean_name) not between 1 and 100
    or char_length(clean_email) > 254 or clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    or char_length(clean_role) > 100 or char_length(clean_company) > 100
    or char_length(clean_message) not between 1 and 1000 then
    return jsonb_build_object('status', 'invalid');
  end if;
  if not public.is_valid_time_zone(zone) then
    zone := s.time_zone;
  end if;

  -- The slot, in the owner's local time.
  local_start := slot_start at time zone s.time_zone;
  local_day := local_start::date;
  slot_minute := extract(hour from local_start)::integer * 60 + extract(minute from local_start)::integer;
  if extract(second from local_start) <> 0 then
    return jsonb_build_object('status', 'taken');
  end if;

  select o.ranges into day_ranges from public.booking_overrides o where o.user_id = owner.id and o.day = local_day;
  if found then
    select exists (
      select 1 from jsonb_array_elements(day_ranges) r
      where slot_minute >= (r ->> 'start')::integer and slot_minute + 30 <= (r ->> 'end')::integer
    ) into in_range;
  else
    select exists (
      select 1 from public.booking_availability a
      where a.user_id = owner.id and a.weekday = extract(isodow from local_day)
        and slot_minute >= a.start_minute and slot_minute + 30 <= a.end_minute
    ) into in_range;
  end if;

  if not in_range
    or (slot_minute % 30 <> 0 and not exists (
      select 1 from public.bookings b
      where b.user_id = owner.id and b.status = 'confirmed' and b.blocked_until = slot_start
    ))
    or slot_start < now() + make_interval(mins => s.notice_minutes)
    or slot_start >= now() + make_interval(days => s.horizon_days)
    or (s.daily_limit is not null and (
      select count(*) from public.bookings b
      where b.user_id = owner.id and b.status = 'confirmed'
        and (b.start_at at time zone s.time_zone)::date = local_day
    ) >= s.daily_limit) then
    return jsonb_build_object('status', 'taken');
  end if;

  -- Against abuse (docs/booking.md, "Protection contre les abus").
  if (
    select count(*) from public.bookings b
    where b.user_id = owner.id and b.status = 'confirmed' and b.end_at > now() and lower(b.guest_email) = clean_email
  ) >= 3 then
    return jsonb_build_object('status', 'limit_email');
  end if;
  if ip_hash is not null and (
    select count(*) from public.booking_attempts t where t.ip_hash = book_public_slot.ip_hash and t.created_at > now() - interval '1 hour'
  ) >= 10 then
    return jsonb_build_object('status', 'limit_ip');
  end if;

  begin
    insert into public.bookings (
      user_id, start_at, end_at, blocked_until, guest_name, guest_email, guest_role, guest_company,
      guest_message, guest_time_zone
    )
    values (
      owner.id, slot_start, slot_start + interval '30 minutes',
      slot_start + make_interval(mins => 30 + s.buffer_minutes),
      clean_name, clean_email, clean_role, clean_company, clean_message, zone
    )
    returning * into booking;
  exception when exclusion_violation then
    return jsonb_build_object('status', 'taken');
  end;

  if ip_hash is not null then
    insert into public.booking_attempts (ip_hash) values (book_public_slot.ip_hash);
  end if;

  -- The two emails (prepared, not sent): the confirmation to the guest, the news to the owner.
  owner_name := coalesce(nullif(btrim(coalesce(owner.first_name, '') || ' ' || coalesce(owner.last_name, '')), ''), owner.handle);
  with added as (
    insert into public.booking_emails (user_id, booking_id, template, recipient, data)
    values
      (owner.id, booking.id, 'guest_confirmation', booking.guest_email, jsonb_build_object(
        'ownerName', owner_name, 'guestName', booking.guest_name,
        'startAt', booking.start_at, 'endAt', booking.end_at, 'timeZone', booking.guest_time_zone,
        'path', '/' || owner.handle || '/booking/' || booking.code
      )),
      (owner.id, booking.id, 'owner_new_booking', coalesce(owner.email, ''), jsonb_build_object(
        'ownerName', owner_name, 'guestName', booking.guest_name, 'guestEmail', booking.guest_email,
        'guestRole', booking.guest_role, 'guestCompany', booking.guest_company, 'message', booking.guest_message,
        'startAt', booking.start_at, 'endAt', booking.end_at, 'timeZone', s.time_zone,
        'path', '/app/booking'
      ))
    returning id
  )
  select array_agg(id) into email_ids from added;

  return jsonb_build_object('status', 'ok', 'code', booking.code, 'emailIds', to_jsonb(email_ids));
end;
$$;

revoke execute on function public.book_public_slot(text, timestamptz, text, text, text, text, text, text, text, text) from public;
grant execute on function public.book_public_slot(text, timestamptz, text, text, text, text, text, text, text, text) to anon, authenticated;
