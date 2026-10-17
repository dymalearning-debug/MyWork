-- Rendez-vous module (see docs/booking.md, "Données"): the owner's availability, the bookings of
-- their guests (visitors without an account), and the queue of the emails prepared for them.
-- The owner reads their rows through RLS and changes them through the functions below. Visitors
-- never reach the tables: dedicated functions, opened to anonymous visitors, give the free slots of
-- an online profile, take a booking (checking every rule again), and read or cancel a booking from
-- its secret code.

create extension if not exists btree_gist with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- ——— Helpers ———

-- A time zone known to the database (the list of "Fuseau horaire").
create function public.is_valid_time_zone(zone text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = zone);
$$;

-- The secret code of a booking, in the guest's link: 24 random characters (144 bits), impossible
-- to guess.
create function public.new_booking_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/', '-_');
$$;

-- The short reference shown on the guest's page ("K7QM-2XR9"): random, never derived from the
-- code, so that it cannot lead back to the link.
create function public.new_booking_reference()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(8);
  result text := '';
begin
  for i in 0..7 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
    if i = 3 then
      result := result || '-';
    end if;
  end loop;
  return result;
end;
$$;

-- A list of time ranges of a day, in minutes from midnight: [{"start": 540, "end": 720}, ...].
-- On the 30-minute grid, inside the day, at least 30 minutes long, never overlapping.
create function public.are_valid_booking_ranges(ranges jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(ranges) = 'array'
    and jsonb_array_length(ranges) <= 12
    and not exists (
      select 1 from jsonb_array_elements(ranges) r
      where jsonb_typeof(r -> 'start') <> 'number' or jsonb_typeof(r -> 'end') <> 'number'
        or (r ->> 'start')::numeric % 30 <> 0 or (r ->> 'end')::numeric % 30 <> 0
        or (r ->> 'start')::numeric < 0 or (r ->> 'end')::numeric > 1440
        or (r ->> 'end')::numeric - (r ->> 'start')::numeric < 30
    )
    and not exists (
      select 1
      from jsonb_array_elements(ranges) with ordinality a(r, i)
      join jsonb_array_elements(ranges) with ordinality b(r, i) on a.i < b.i
      where (a.r ->> 'start')::numeric < (b.r ->> 'end')::numeric
        and (b.r ->> 'start')::numeric < (a.r ->> 'end')::numeric
    );
$$;

-- ——— Tables ———

-- Settings ("Disponibilités", "Réglages"): one row per user, created at the first visit.
-- Bookings are closed by default.
create table public.booking_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  is_open boolean not null default false,
  time_zone text not null default 'Europe/Paris' check (public.is_valid_time_zone(time_zone)),
  buffer_minutes integer not null default 15 check (buffer_minutes in (0, 15, 30)),
  notice_minutes integer not null default 240 check (notice_minutes in (60, 120, 240, 720, 1440, 2880)),
  horizon_days integer not null default 60 check (horizon_days in (14, 30, 60, 90)),
  daily_limit integer check (daily_limit between 1 and 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Weekly hours: one row per range. weekday: 1 (Monday) to 7 (Sunday). Minutes from midnight, in
-- the owner's time zone.
create table public.booking_availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  start_minute integer not null check (start_minute between 0 and 1410 and start_minute % 30 = 0),
  end_minute integer not null check (end_minute between 30 and 1440 and end_minute % 30 = 0),
  check (end_minute > start_minute)
);

create index booking_availability_user_id_idx on public.booking_availability (user_id, weekday);

-- Special days: their own ranges, or none at all (unavailable all day).
create table public.booking_overrides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  ranges jsonb not null default '[]'::jsonb check (public.are_valid_booking_ranges(ranges)),
  primary key (user_id, day)
);

-- The bookings. Times in UTC. blocked_until: the end, plus the break that follows (the setting at
-- the time of the booking). Two confirmed bookings of an owner never overlap, break included: the
-- database refuses the second one, even when both arrive at the same second.
-- code: the secret of the guest's link. Kept as is (not as a hash): the owner copies the guest's
-- link from "Mes rendez-vous" while the emails are not sent (docs/booking.md, "Précisé pendant
-- le développement"). Only the owner (RLS) and the holder of the code reach the row.
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  blocked_until timestamptz not null,
  guest_name text not null check (char_length(guest_name) between 1 and 100 and btrim(guest_name) <> ''),
  guest_email text not null check (char_length(guest_email) <= 254 and guest_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  guest_role text check (char_length(guest_role) <= 100),
  guest_company text check (char_length(guest_company) <= 100),
  guest_message text not null check (char_length(guest_message) between 1 and 1000 and btrim(guest_message) <> ''),
  guest_time_zone text not null default 'Europe/Paris',
  code text not null unique default public.new_booking_code(),
  reference text not null default public.new_booking_reference(),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  cancelled_by text check (cancelled_by in ('owner', 'guest')),
  cancel_message text check (char_length(cancel_message) <= 1000),
  is_seen boolean not null default false,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  period tstzrange generated always as (tstzrange(start_at, blocked_until, '[)')) stored,
  check (end_at > start_at and blocked_until >= end_at),
  check ((status = 'cancelled') = (cancelled_by is not null)),
  constraint bookings_no_overlap exclude using gist (user_id with =, period with &&) where (status = 'confirmed')
);

create index bookings_user_id_start_at_idx on public.bookings (user_id, start_at);

-- The emails prepared for the bookings (docs/booking.md, "E-mails"): recipient, template, data.
-- Not sent while there is no sending service: they stay "pending" ("non envoyé"). With Resend,
-- they will be sent, or abandoned. Nobody reads them through the API yet.
create table public.booking_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  template text not null check (template in ('guest_confirmation', 'owner_new_booking', 'guest_cancelled', 'owner_cancelled')),
  recipient text not null,
  data jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'abandoned')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index booking_emails_booking_id_idx on public.booking_emails (booking_id);

-- Bookings taken from each IP address in the last hours (a hash, never the address itself): no
-- more than 10 an hour. Emptied every day.
create table public.booking_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index booking_attempts_ip_hash_idx on public.booking_attempts (ip_hash, created_at);

-- ——— "Disponibilités" (the owner) ———

-- Default hours, at the first visit: Monday to Friday, 9:00–12:00 and 14:00–18:00.
create function public.default_booking_availability(owner uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.booking_availability (user_id, weekday, start_minute, end_minute)
  select owner, d, r.s, r.e
  from generate_series(1, 5) d, (values (540, 720), (840, 1080)) as r(s, e);
$$;

-- The whole page: settings, weekly hours, special days to come (in the owner's time zone), and
-- the days that already have bookings (warning on a special day). Creates the settings at the
-- first visit ("isNew").
create function public.get_own_booking_setup()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid := (select auth.uid());
  is_new boolean := false;
  s public.booking_settings;
begin
  if owner is null then
    raise exception 'Not signed in';
  end if;
  select * into s from public.booking_settings where user_id = owner;
  if not found then
    insert into public.booking_settings (user_id) values (owner) on conflict (user_id) do nothing;
    if not exists (select 1 from public.booking_availability where user_id = owner) then
      perform public.default_booking_availability(owner);
    end if;
    select * into s from public.booking_settings where user_id = owner;
    is_new := true;
  end if;

  return jsonb_build_object(
    'isNew', is_new,
    'settings', jsonb_build_object(
      'isOpen', s.is_open,
      'timeZone', s.time_zone,
      'bufferMinutes', s.buffer_minutes,
      'noticeMinutes', s.notice_minutes,
      'horizonDays', s.horizon_days,
      'dailyLimit', s.daily_limit
    ),
    'weekly', coalesce((
      select jsonb_agg(jsonb_build_object('weekday', a.weekday, 'start', a.start_minute, 'end', a.end_minute)
        order by a.weekday, a.start_minute)
      from public.booking_availability a where a.user_id = owner
    ), '[]'::jsonb),
    'overrides', coalesce((
      select jsonb_agg(jsonb_build_object('day', o.day, 'ranges', o.ranges) order by o.day)
      from public.booking_overrides o
      where o.user_id = owner and o.day >= (now() at time zone s.time_zone)::date
    ), '[]'::jsonb),
    'bookedDays', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'count', d.count) order by d.day)
      from (
        select (b.start_at at time zone s.time_zone)::date as day, count(*) as count
        from public.bookings b
        where b.user_id = owner and b.status = 'confirmed' and b.end_at > now()
        group by 1
      ) d
    ), '[]'::jsonb)
  );
end;
$$;

-- "Enregistrer": the whole page at once. Changing the hours never cancels a booking.
-- weekly: [{"weekday", "start", "end"}]; overrides: [{"day", "ranges"}] (past days are dropped).
create function public.save_own_booking_setup(settings jsonb, weekly jsonb, overrides jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid := (select auth.uid());
  zone text := settings ->> 'timeZone';
  day_ranges jsonb;
begin
  if owner is null then
    raise exception 'Not signed in';
  end if;
  if jsonb_typeof(weekly) <> 'array' or jsonb_typeof(overrides) <> 'array' or jsonb_array_length(overrides) > 366 then
    raise exception 'booking_invalid_setup';
  end if;

  insert into public.booking_settings (user_id, is_open, time_zone, buffer_minutes, notice_minutes, horizon_days, daily_limit, updated_at)
  values (
    owner,
    (settings ->> 'isOpen')::boolean,
    zone,
    (settings ->> 'bufferMinutes')::integer,
    (settings ->> 'noticeMinutes')::integer,
    (settings ->> 'horizonDays')::integer,
    nullif(settings ->> 'dailyLimit', '')::integer,
    now()
  )
  on conflict (user_id) do update set
    is_open = excluded.is_open,
    time_zone = excluded.time_zone,
    buffer_minutes = excluded.buffer_minutes,
    notice_minutes = excluded.notice_minutes,
    horizon_days = excluded.horizon_days,
    daily_limit = excluded.daily_limit,
    updated_at = now();

  -- Weekly hours: the ranges of each day must not overlap.
  for i in 1..7 loop
    select coalesce(jsonb_agg(jsonb_build_object('start', w -> 'start', 'end', w -> 'end')), '[]'::jsonb)
    into day_ranges
    from jsonb_array_elements(weekly) w
    where (w ->> 'weekday')::integer = i;
    if not public.are_valid_booking_ranges(day_ranges) then
      raise exception 'booking_invalid_setup';
    end if;
  end loop;
  if exists (select 1 from jsonb_array_elements(weekly) w where (w ->> 'weekday')::integer not between 1 and 7) then
    raise exception 'booking_invalid_setup';
  end if;

  delete from public.booking_availability where user_id = owner;
  insert into public.booking_availability (user_id, weekday, start_minute, end_minute)
  select owner, (w ->> 'weekday')::smallint, (w ->> 'start')::integer, (w ->> 'end')::integer
  from jsonb_array_elements(weekly) w;

  delete from public.booking_overrides where user_id = owner;
  insert into public.booking_overrides (user_id, day, ranges)
  select owner, (o ->> 'day')::date, coalesce(o -> 'ranges', '[]'::jsonb)
  from jsonb_array_elements(overrides) o
  where (o ->> 'day')::date >= (now() at time zone zone)::date;
end;
$$;

-- ——— Public reads ———

-- Whether the "Rendez-vous" tab is shown: bookings open, on an online profile (or its owner's
-- preview of their offline profile).
create function public.is_public_booking_open(profile_handle text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.booking_settings s on s.user_id = p.id
    where p.handle = profile_handle and s.is_open
      and (p.is_online or p.id = (select auth.uid()))
  );
$$;

-- What the slots are computed from (src/lib/booking/slots.ts): the settings, the hours, the
-- special days, and the busy periods of the confirmed bookings — never who booked. null: no such
-- profile, offline, or bookings closed.
create function public.get_public_booking_availability(profile_handle text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'now', now(),
    'timeZone', s.time_zone,
    'bufferMinutes', s.buffer_minutes,
    'noticeMinutes', s.notice_minutes,
    'horizonDays', s.horizon_days,
    'dailyLimit', s.daily_limit,
    'weekly', coalesce((
      select jsonb_agg(jsonb_build_object('weekday', a.weekday, 'start', a.start_minute, 'end', a.end_minute)
        order by a.weekday, a.start_minute)
      from public.booking_availability a where a.user_id = p.id
    ), '[]'::jsonb),
    'overrides', coalesce((
      select jsonb_agg(jsonb_build_object('day', o.day, 'ranges', o.ranges) order by o.day)
      from public.booking_overrides o
      where o.user_id = p.id and o.day >= (now() at time zone s.time_zone)::date - 1
    ), '[]'::jsonb),
    'busy', coalesce((
      select jsonb_agg(jsonb_build_object('start', b.start_at, 'end', b.blocked_until) order by b.start_at)
      from public.bookings b
      where b.user_id = p.id and b.status = 'confirmed'
        and b.blocked_until > now() - interval '2 days'
        and b.start_at < now() + make_interval(days => s.horizon_days + 2)
    ), '[]'::jsonb)
  )
  from public.profiles p
  join public.booking_settings s on s.user_id = p.id
  where p.handle = profile_handle and s.is_open
    and (p.is_online or p.id = (select auth.uid()));
$$;

-- ——— Booking (the visitor) ———

-- The same rules as the slots shown to the visitor (src/lib/booking/slots.ts), checked again: a
-- start inside a range of the day (or of the special day), on the 30-minute grid or right after
-- the break of another booking; the notice, the horizon, the limit per day. The overlap itself
-- (break included) is refused by the table.
-- Results: ok (with the code of the link and the emails prepared), closed, taken (the slot is no
-- longer free), limit_email (3 upcoming bookings for this email), limit_ip (10 an hour), invalid.
create function public.book_public_slot(
  profile_handle text,
  slot_start timestamptz,
  guest_name text,
  guest_email text,
  guest_role text,
  guest_company text,
  guest_message text,
  guest_time_zone text,
  ip_hash text
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

-- ——— The guest's link ———

-- A booking from its code, on the profile of its owner: works even if the profile went offline
-- or bookings closed (a booking taken must be able to take place). null: wrong code.
create function public.get_public_booking(profile_handle text, booking_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', b.id,
    'reference', b.reference,
    'startAt', b.start_at,
    'endAt', b.end_at,
    'status', b.status,
    'cancelledBy', b.cancelled_by,
    'cancelMessage', b.cancel_message,
    'guestName', b.guest_name,
    'guestTimeZone', b.guest_time_zone,
    'owner', jsonb_build_object(
      'handle', p.handle,
      'firstName', coalesce(p.first_name, ''),
      'lastName', coalesce(p.last_name, ''),
      'photoUrl', p.photo_url
    ),
    'bookable', p.is_online and coalesce(s.is_open, false)
  )
  from public.bookings b
  join public.profiles p on p.id = b.user_id
  left join public.booking_settings s on s.user_id = p.id
  where p.handle = profile_handle and b.code = booking_code and char_length(booking_code) = 24;
$$;

-- "Annuler le rendez-vous", by the guest, until its start. The owner gets an email (prepared).
-- Results: ok (with the email prepared), not_found, not_cancellable (cancelled or started).
create function public.cancel_public_booking(profile_handle text, booking_code text, reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking public.bookings;
  owner public.profiles;
  zone text;
  email_id uuid;
  clean_reason text := nullif(btrim(coalesce(reason, '')), '');
begin
  if char_length(clean_reason) > 1000 then
    return jsonb_build_object('status', 'invalid');
  end if;
  select b.* into booking
  from public.bookings b join public.profiles p on p.id = b.user_id
  where p.handle = profile_handle and b.code = booking_code and char_length(booking_code) = 24
  for update of b;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  if booking.status <> 'confirmed' or booking.start_at <= now() then
    return jsonb_build_object('status', 'not_cancellable');
  end if;

  update public.bookings
  set status = 'cancelled', cancelled_by = 'guest', cancel_message = clean_reason, cancelled_at = now()
  where id = booking.id;

  select * into owner from public.profiles where id = booking.user_id;
  select coalesce((select time_zone from public.booking_settings where user_id = owner.id), 'Europe/Paris') into zone;
  insert into public.booking_emails (user_id, booking_id, template, recipient, data)
  values (owner.id, booking.id, 'owner_cancelled', coalesce(owner.email, ''), jsonb_build_object(
    'guestName', booking.guest_name, 'startAt', booking.start_at, 'endAt', booking.end_at,
    'timeZone', zone, 'message', clean_reason, 'path', '/app/booking?filter=cancelled'
  ))
  returning id into email_id;

  return jsonb_build_object('status', 'ok', 'emailIds', jsonb_build_array(email_id));
end;
$$;

-- ——— "Mes rendez-vous" (the owner) ———

-- "Annuler le rendez-vous", by the owner, with an optional message for the guest, who gets an
-- email (prepared). Same results as for the guest.
create function public.cancel_own_booking(booking_id uuid, message text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking public.bookings;
  owner public.profiles;
  owner_name text;
  email_id uuid;
  clean_message text := nullif(btrim(coalesce(message, '')), '');
begin
  if char_length(clean_message) > 1000 then
    return jsonb_build_object('status', 'invalid');
  end if;
  select * into booking from public.bookings
  where id = booking_id and user_id = (select auth.uid())
  for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  if booking.status <> 'confirmed' or booking.end_at <= now() then
    return jsonb_build_object('status', 'not_cancellable');
  end if;

  update public.bookings
  set status = 'cancelled', cancelled_by = 'owner', cancel_message = clean_message, cancelled_at = now(), is_seen = true
  where id = booking.id;

  select * into owner from public.profiles where id = booking.user_id;
  owner_name := coalesce(nullif(btrim(coalesce(owner.first_name, '') || ' ' || coalesce(owner.last_name, '')), ''), owner.handle);
  insert into public.booking_emails (user_id, booking_id, template, recipient, data)
  values (owner.id, booking.id, 'guest_cancelled', booking.guest_email, jsonb_build_object(
    'ownerName', owner_name, 'guestName', booking.guest_name, 'startAt', booking.start_at,
    'endAt', booking.end_at, 'timeZone', booking.guest_time_zone, 'message', clean_message,
    'path', '/' || owner.handle || '/booking'
  ))
  returning id into email_id;

  return jsonb_build_object('status', 'ok', 'emailIds', jsonb_build_array(email_id));
end;
$$;

-- ——— Access ———
-- RLS: each user reads only their own rows. Their settings, hours and special days change through
-- save_own_booking_setup(); their bookings through cancel_own_booking(), plus "consulté" and the
-- deletion of past or cancelled ones. Emails and IP addresses: no access through the API.
-- The administrator role (end-to-end tests) has full access.
alter table public.booking_settings enable row level security;
alter table public.booking_availability enable row level security;
alter table public.booking_overrides enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_emails enable row level security;
alter table public.booking_attempts enable row level security;

create policy "Users can read their own booking settings"
  on public.booking_settings for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own availability"
  on public.booking_availability for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own special days"
  on public.booking_overrides for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own bookings"
  on public.bookings for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can mark their own bookings as seen"
  on public.bookings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own past or cancelled bookings"
  on public.bookings for delete to authenticated
  using ((select auth.uid()) = user_id and (status = 'cancelled' or end_at <= now()));

revoke all on public.booking_settings, public.booking_availability, public.booking_overrides,
  public.bookings, public.booking_emails, public.booking_attempts from anon, authenticated;
grant select on public.booking_settings, public.booking_availability, public.booking_overrides to authenticated;
grant select, delete on public.bookings to authenticated;
grant update (is_seen) on public.bookings to authenticated;
grant select, insert, update, delete on public.booking_settings, public.booking_availability,
  public.booking_overrides, public.bookings, public.booking_emails, public.booking_attempts to service_role;

revoke execute on function public.is_valid_time_zone(text) from public, anon, authenticated;
revoke execute on function public.new_booking_code() from public, anon, authenticated;
revoke execute on function public.new_booking_reference() from public, anon, authenticated;
revoke execute on function public.are_valid_booking_ranges(jsonb) from public, anon, authenticated;
revoke execute on function public.default_booking_availability(uuid) from public, anon, authenticated;
revoke execute on function public.get_own_booking_setup() from public, anon;
revoke execute on function public.save_own_booking_setup(jsonb, jsonb, jsonb) from public, anon;
revoke execute on function public.is_public_booking_open(text) from public;
revoke execute on function public.get_public_booking_availability(text) from public;
revoke execute on function public.book_public_slot(text, timestamptz, text, text, text, text, text, text, text) from public;
revoke execute on function public.get_public_booking(text, text) from public;
revoke execute on function public.cancel_public_booking(text, text, text) from public;
revoke execute on function public.cancel_own_booking(uuid, text) from public, anon;
grant execute on function public.is_valid_time_zone(text) to service_role;
grant execute on function public.new_booking_code() to service_role;
grant execute on function public.new_booking_reference() to service_role;
grant execute on function public.are_valid_booking_ranges(jsonb) to service_role;
grant execute on function public.get_own_booking_setup() to authenticated;
grant execute on function public.save_own_booking_setup(jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.is_public_booking_open(text) to anon, authenticated;
grant execute on function public.get_public_booking_availability(text) to anon, authenticated;
grant execute on function public.book_public_slot(text, timestamptz, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.get_public_booking(text, text) to anon, authenticated;
grant execute on function public.cancel_public_booking(text, text, text) to anon, authenticated;
grant execute on function public.cancel_own_booking(uuid, text) to authenticated;

-- ——— Scheduled clean-up (pg_cron, every night at 3:00 UTC) ———
-- Bookings are deleted a year after their date, with their guest's data and their emails
-- (docs/booking.md, "RGPD"); the IP addresses after a day.
select cron.schedule(
  'delete-old-bookings',
  '0 3 * * *',
  $$delete from public.bookings where start_at < now() - interval '1 year'$$
);
select cron.schedule(
  'delete-old-booking-attempts',
  '15 3 * * *',
  $$delete from public.booking_attempts where created_at < now() - interval '1 day'$$
);
