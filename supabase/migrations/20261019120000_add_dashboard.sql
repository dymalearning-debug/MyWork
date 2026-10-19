-- Tableau de bord (docs/dashboard.md, "Données"): the visits of the public profile and what
-- visitors did there ("signaux d'intérêt"), for the owner's dashboard.
--
-- A visitor is counted once a day, without any cookie: a hash of their IP address and browser
-- with a random salt of the day. The salt is deleted the next night, so a hash cannot be linked
-- to the same visitor another day, nor reversed to the address (never stored). The owner (signed
-- in), and an offline profile, are never counted. Everything is deleted after 90 days.
-- Days are those of Paris, like the dates of the Drive.

-- ——— Tables ———

-- The salt of each day, made at the first visit of the day. No access through the API.
create table public.profile_visit_salts (
  day date primary key,
  salt text not null default encode(extensions.gen_random_bytes(32), 'hex')
);

-- One row per visitor, tab and day. tab: "profile" (/<handle>), "booking", "resources".
create table public.profile_visits (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  tab text not null check (tab in ('profile', 'booking', 'resources')),
  visitor text not null,
  primary key (user_id, day, tab, visitor)
);

-- What visitors did: "Me contacter" opened ("contact"), the CV downloaded ("cv"), a public file
-- of the Drive downloaded ("resource", with its name at the time). Bookings are read from the
-- bookings table itself.
create table public.profile_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('contact', 'cv', 'resource')),
  item_name text check (char_length(item_name) <= 255),
  created_at timestamptz not null default now()
);

create index profile_events_user_id_created_at_idx on public.profile_events (user_id, created_at);

-- ——— Recording (visitors) ———

-- The day of Paris.
create function public.paris_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Paris')::date;
$$;

-- A visit of a tab of an online profile. visitor_key: the IP address and the browser, given by the
-- application; only its salted hash is kept. Nothing for the owner, nor for an offline profile.
create function public.record_profile_visit(profile_handle text, visit_tab text, visitor_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  today date := public.paris_today();
  day_salt text;
begin
  if visit_tab not in ('profile', 'booking', 'resources') or coalesce(visitor_key, '') = ''
    or char_length(visitor_key) > 1000 then
    return;
  end if;
  select p.id into owner_id from public.profiles p where p.handle = profile_handle and p.is_online;
  if owner_id is null or owner_id = (select auth.uid()) then
    return;
  end if;

  insert into public.profile_visit_salts (day) values (today) on conflict (day) do nothing;
  select s.salt into day_salt from public.profile_visit_salts s where s.day = today;
  insert into public.profile_visits (user_id, day, tab, visitor)
  values (owner_id, today, visit_tab, encode(extensions.digest(day_salt || '|' || visitor_key, 'sha256'), 'hex'))
  on conflict do nothing;
end;
$$;

-- A signal of an online profile: "contact", "cv", or "resource" (item_id: a public file of the
-- owner). Nothing for the owner, nor for an offline profile.
create function public.record_profile_event(profile_handle text, event_kind text, item_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  file_name text;
begin
  if event_kind not in ('contact', 'cv', 'resource') then
    return;
  end if;
  select p.id into owner_id from public.profiles p where p.handle = profile_handle and p.is_online;
  if owner_id is null or owner_id = (select auth.uid()) then
    return;
  end if;
  if event_kind = 'resource' then
    select d.name into file_name from public.drive_items d
    where d.id = item_id and d.user_id = owner_id and d.kind = 'file' and d.is_uploaded and d.visibility = 'public';
    if file_name is null then
      return;
    end if;
  end if;
  insert into public.profile_events (user_id, kind, item_name) values (owner_id, event_kind, file_name);
end;
$$;

-- ——— The dashboard (the owner) ———

-- Everything the dashboard shows but today's bookings: visitors over 7 and 30 days with the period
-- before, visitors of each of the last 30 days, of each tab, the signals of the last 30 days, and
-- what the reminders need.
create function public.get_own_dashboard()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select (select auth.uid()) as id, public.paris_today() as today
  ),
  visits as (
    select v.day, v.tab, v.visitor
    from public.profile_visits v, me
    where v.user_id = me.id and v.day > me.today - 60
  ),
  daily as (
    select d::date as day, (select count(distinct visitor) from visits where visits.day = d::date) as visitors
    from me, generate_series((me.today - 29)::timestamp, me.today::timestamp, interval '1 day') d
  ),
  events as (
    select e.kind, e.item_name, e.created_at
    from public.profile_events e, me
    where e.user_id = me.id and e.created_at > now() - interval '30 days'
  ),
  booked as (
    select b.created_at
    from public.bookings b, me
    where b.user_id = me.id and b.created_at > now() - interval '30 days'
  )
  select jsonb_build_object(
    'visitors7', (select count(distinct (day, visitor)) from visits, me where day > me.today - 7),
    'visitorsPrevious7', (select count(distinct (day, visitor)) from visits, me where day <= me.today - 7 and day > me.today - 14),
    'visitors30', (select count(distinct (day, visitor)) from visits, me where day > me.today - 30),
    'visitorsPrevious30', (select count(distinct (day, visitor)) from visits, me where day <= me.today - 30),
    'daily', (select jsonb_agg(jsonb_build_object('day', day, 'visitors', visitors) order by day) from daily),
    'tabs', jsonb_build_object(
      'profile', (select count(distinct (day, visitor)) from visits, me where tab = 'profile' and day > me.today - 30),
      'booking', (select count(distinct (day, visitor)) from visits, me where tab = 'booking' and day > me.today - 30),
      'resources', (select count(distinct (day, visitor)) from visits, me where tab = 'resources' and day > me.today - 30)
    ),
    'signals', jsonb_build_object(
      'bookings', jsonb_build_object('count', (select count(*) from booked), 'lastAt', (select max(created_at) from booked)),
      'contact', jsonb_build_object(
        'count', (select count(*) from events where kind = 'contact'),
        'lastAt', (select max(created_at) from events where kind = 'contact')
      ),
      'cv', jsonb_build_object(
        'count', (select count(*) from events where kind = 'cv'),
        'lastAt', (select max(created_at) from events where kind = 'cv')
      ),
      'resources', jsonb_build_object(
        'count', (select count(*) from events where kind = 'resource'),
        'lastAt', (select max(created_at) from events where kind = 'resource'),
        'top', (
          select jsonb_build_object('name', item_name, 'count', count(*))
          from events where kind = 'resource'
          group by item_name order by count(*) desc, max(created_at) desc limit 1
        )
      )
    ),
    'isOnline', (select p.is_online from public.profiles p, me where p.id = me.id),
    'bookingOpen', coalesce((select s.is_open from public.booking_settings s, me where s.user_id = me.id), false),
    'storageUsed', public.storage_used((select id from me)),
    'storageCapacity', public.storage_capacity()
  )
  from me
  where me.id is not null;
$$;

-- ——— Access ———
-- RLS on, and no policy: the tables are reached only through the functions above. The
-- administrator role (end-to-end tests) has full access.
alter table public.profile_visit_salts enable row level security;
alter table public.profile_visits enable row level security;
alter table public.profile_events enable row level security;

revoke all on public.profile_visit_salts, public.profile_visits, public.profile_events from anon, authenticated;
grant select, insert, update, delete on public.profile_visit_salts, public.profile_visits, public.profile_events to service_role;

revoke execute on function public.paris_today() from public, anon, authenticated;
revoke execute on function public.record_profile_visit(text, text, text) from public;
revoke execute on function public.record_profile_event(text, text, uuid) from public;
revoke execute on function public.get_own_dashboard() from public, anon;
grant execute on function public.paris_today() to service_role;
grant execute on function public.record_profile_visit(text, text, text) to anon, authenticated;
grant execute on function public.record_profile_event(text, text, uuid) to anon, authenticated;
grant execute on function public.get_own_dashboard() to authenticated;

-- ——— Scheduled clean-up (pg_cron, every night) ———
-- The salts of the days before (the hashes can no longer be linked to anyone), and the visits and
-- signals after 90 days.
select cron.schedule(
  'delete-old-visit-salts',
  '30 3 * * *',
  $$delete from public.profile_visit_salts where day < public.paris_today()$$
);
select cron.schedule(
  'delete-old-profile-visits',
  '45 3 * * *',
  $$delete from public.profile_visits where day < public.paris_today() - 90;
    delete from public.profile_events where created_at < now() - interval '90 days'$$
);
