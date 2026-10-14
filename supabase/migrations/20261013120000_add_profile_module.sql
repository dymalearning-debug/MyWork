-- Profil module (see docs/profile.md, "Données"): the professional profile, filled in "Mon profil"
-- and shown in the "Profil" tab of the public page.
-- Single fields are columns of profiles; each list has its own table. Users only read through the
-- functions below, and only write through save_own_profile(), which checks every limit at once.

-- ——— Single fields ———

alter table public.profiles
  add column headline text,
  add column location text,
  add column about text,
  add column contact_email text,
  add column phone text,
  add column photo_url text,
  add column is_freelance boolean not null default true,
  add column availability text not null default 'unspecified',
  add column available_from date,
  add column work_modes text[] not null default '{}',
  add column travel_zone text,
  add column daily_rate integer,
  add column section_order text[] not null default array[
    'about', 'freelance', 'experiences', 'projects', 'educations', 'certifications', 'skills',
    'languages', 'recommendations'
  ];

alter table public.profiles
  add constraint profiles_headline_length check (char_length(headline) <= 100),
  add constraint profiles_location_length check (char_length(location) <= 100),
  add constraint profiles_about_length check (char_length(about) <= 2600),
  add constraint profiles_contact_email_format check (
    char_length(contact_email) <= 254 and contact_email ~ '^[^@\s]+@[^@\s]+$'
  ),
  add constraint profiles_phone_format check (phone ~ '^[0-9 +.()-]{6,20}$'),
  add constraint profiles_photo_url_format check (char_length(photo_url) <= 1000 and photo_url ~ '^https://'),
  add constraint profiles_availability_value check (
    availability in ('unspecified', 'available', 'available_from', 'unavailable')
  ),
  add constraint profiles_available_from_set check (availability <> 'available_from' or available_from is not null),
  add constraint profiles_work_modes_values check (work_modes <@ array['remote', 'onsite', 'hybrid']),
  add constraint profiles_travel_zone_length check (char_length(travel_zone) <= 100),
  add constraint profiles_daily_rate_range check (daily_rate between 1 and 100000),
  add constraint profiles_section_order_values check (
    cardinality(section_order) = 9 and section_order <@ array[
      'about', 'freelance', 'experiences', 'projects', 'educations', 'certifications', 'skills',
      'languages', 'recommendations'
    ]
  );

-- Starting values: the contact email is a copy of the sign-in address, the photo is the Google one.
create function public.google_photo_url(metadata jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when url ~ '^https://' and char_length(url) <= 1000 then url end
  from (select coalesce(metadata ->> 'avatar_url', metadata ->> 'picture') as url) as photo;
$$;

update public.profiles p
set contact_email = case when p.email ~ '^[^@\s]+@[^@\s]+$' then p.email end,
    photo_url = public.google_photo_url(u.raw_user_meta_data)
from auth.users u
where u.id = p.id;

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
      insert into public.profiles (id, email, handle, first_name, last_name, contact_email, photo_url)
      values (
        new.id,
        new.email,
        public.build_handle(
          coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
          new.email
        ),
        names.first_name,
        names.last_name,
        case when new.email ~ '^[^@\s]+@[^@\s]+$' then new.email end,
        public.google_photo_url(new.raw_user_meta_data)
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

-- ——— Lists ———
-- Every row belongs to a user and carries its position (the order chosen by hand). Rows that point
-- to another row (a project and its experience, a skill used in an experience) go through
-- (id, user_id) keys: they can only point to a row of the same user.

create table public.profile_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null,
  url text not null check (char_length(url) <= 500 and url ~ '^https?://[^\s]+$'),
  label text check (char_length(label) <= 100)
);

create table public.profile_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null,
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 500)
);

create table public.profile_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null,
  title text not null check (char_length(title) between 1 and 100),
  company text check (char_length(company) <= 100),
  location text check (char_length(location) <= 100),
  employment_type text check (
    employment_type in ('freelance', 'permanent', 'fixed_term', 'internship', 'apprenticeship', 'temporary')
  ),
  work_mode text check (work_mode in ('onsite', 'hybrid', 'remote')),
  start_year smallint not null check (start_year between 1900 and 2100),
  start_month smallint check (start_month between 1 and 12),
  end_year smallint check (end_year between 1900 and 2100),
  end_month smallint check (end_month between 1 and 12 and end_year is not null),
  is_current boolean not null default false check (not (is_current and end_year is not null)),
  description text check (char_length(description) <= 2000),
  unique (id, user_id)
);

create table public.profile_educations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null,
  school text not null check (char_length(school) between 1 and 100),
  degree text check (char_length(degree) <= 100),
  field text check (char_length(field) <= 100),
  start_year smallint check (start_year between 1900 and 2100),
  start_month smallint check (start_month between 1 and 12 and start_year is not null),
  end_year smallint check (end_year between 1900 and 2100),
  end_month smallint check (end_month between 1 and 12 and end_year is not null),
  is_current boolean not null default false check (not (is_current and end_year is not null)),
  description text check (char_length(description) <= 1000)
);

create table public.profile_certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null,
  name text not null check (char_length(name) between 1 and 100),
  issuer text check (char_length(issuer) <= 100),
  credential_id text check (char_length(credential_id) <= 100),
  issued_year smallint check (issued_year between 1900 and 2100),
  issued_month smallint check (issued_month between 1 and 12 and issued_year is not null),
  -- No expiry date: "N'expire pas".
  expires_year smallint check (expires_year between 1900 and 2100),
  expires_month smallint check (expires_month between 1 and 12 and expires_year is not null),
  verification_url text check (char_length(verification_url) <= 500 and verification_url ~ '^https?://[^\s]+$')
);

create table public.profile_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null,
  name text not null check (char_length(name) between 1 and 100),
  description text check (char_length(description) <= 2000),
  start_year smallint check (start_year between 1900 and 2100),
  start_month smallint check (start_month between 1 and 12 and start_year is not null),
  end_year smallint check (end_year between 1900 and 2100),
  end_month smallint check (end_month between 1 and 12 and end_year is not null),
  is_current boolean not null default false check (not (is_current and end_year is not null)),
  url text check (char_length(url) <= 500 and url ~ '^https?://[^\s]+$'),
  experience_id uuid,
  unique (id, user_id),
  foreign key (experience_id, user_id)
    references public.profile_experiences (id, user_id) on delete set null (experience_id)
);

create table public.profile_project_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null,
  position integer not null,
  url text not null check (char_length(url) <= 1000 and url ~ '^https://'),
  foreign key (project_id, user_id) references public.profile_projects (id, user_id) on delete cascade
);

create table public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null,
  name text not null check (char_length(name) between 1 and 50),
  is_featured boolean not null default false,
  unique (id, user_id)
);

create unique index profile_skills_user_name_key on public.profile_skills (user_id, lower(name));

create table public.profile_experience_skills (
  experience_id uuid not null,
  skill_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null,
  primary key (experience_id, skill_id),
  foreign key (experience_id, user_id) references public.profile_experiences (id, user_id) on delete cascade,
  foreign key (skill_id, user_id) references public.profile_skills (id, user_id) on delete cascade
);

create table public.profile_project_skills (
  project_id uuid not null,
  skill_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null,
  primary key (project_id, skill_id),
  foreign key (project_id, user_id) references public.profile_projects (id, user_id) on delete cascade,
  foreign key (skill_id, user_id) references public.profile_skills (id, user_id) on delete cascade
);

create table public.profile_languages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null,
  name text not null check (char_length(name) between 1 and 50),
  level text check (level in ('basic', 'intermediate', 'fluent', 'bilingual', 'native'))
);

create table public.profile_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null,
  text text not null check (char_length(text) between 1 and 1500),
  author text not null check (char_length(author) between 1 and 100),
  author_role text check (char_length(author_role) <= 100),
  author_company text check (char_length(author_company) <= 100),
  author_url text check (char_length(author_url) <= 500 and author_url ~ '^https?://[^\s]+$'),
  given_year smallint check (given_year between 1900 and 2100),
  given_month smallint check (given_month between 1 and 12 and given_year is not null)
);

-- Indexes for the reads by user (the composite keys above already cover their own columns).
create index profile_links_user_id_idx on public.profile_links (user_id);
create index profile_services_user_id_idx on public.profile_services (user_id);
create index profile_experiences_user_id_idx on public.profile_experiences (user_id);
create index profile_educations_user_id_idx on public.profile_educations (user_id);
create index profile_certifications_user_id_idx on public.profile_certifications (user_id);
create index profile_projects_user_id_idx on public.profile_projects (user_id);
create index profile_projects_experience_idx on public.profile_projects (experience_id, user_id);
create index profile_project_images_project_idx on public.profile_project_images (project_id, user_id);
create index profile_project_images_user_id_idx on public.profile_project_images (user_id);
create index profile_experience_skills_skill_idx on public.profile_experience_skills (skill_id, user_id);
create index profile_experience_skills_experience_idx on public.profile_experience_skills (experience_id, user_id);
create index profile_experience_skills_user_id_idx on public.profile_experience_skills (user_id);
create index profile_project_skills_skill_idx on public.profile_project_skills (skill_id, user_id);
create index profile_project_skills_project_idx on public.profile_project_skills (project_id, user_id);
create index profile_project_skills_user_id_idx on public.profile_project_skills (user_id);
create index profile_languages_user_id_idx on public.profile_languages (user_id);
create index profile_recommendations_user_id_idx on public.profile_recommendations (user_id);

-- RLS: each user reads only their own rows. No direct write: everything goes through
-- save_own_profile(). The administrator role (end-to-end tests) has full access.
do $$
declare
  list_table text;
begin
  foreach list_table in array array[
    'profile_links', 'profile_services', 'profile_experiences', 'profile_educations',
    'profile_certifications', 'profile_projects', 'profile_project_images', 'profile_skills',
    'profile_experience_skills', 'profile_project_skills', 'profile_languages', 'profile_recommendations'
  ] loop
    execute format('alter table public.%I enable row level security', list_table);
    execute format(
      'create policy "Users can read their own rows" on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      list_table
    );
    execute format('revoke all on public.%I from anon, authenticated', list_table);
    execute format('grant select on public.%I to authenticated', list_table);
    execute format('grant select, insert, update, delete on public.%I to service_role', list_table);
  end loop;
end;
$$;

-- ——— Reading ———

-- The whole profile of a user, in the shape the app uses (docs/profile.md). for_public: what
-- visitors may see, without the contact email and the phone (only hasContact tells whether there
-- are some), and without the freelance offer when it is switched off. Never the sign-in address.
create function public.profile_content(target uuid, for_public boolean)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'handle', p.handle,
    'isOnline', p.is_online,
    'firstName', coalesce(p.first_name, ''),
    'lastName', coalesce(p.last_name, ''),
    'headline', coalesce(p.headline, ''),
    'location', coalesce(p.location, ''),
    'photoUrl', p.photo_url,
    'contactEmail', case when for_public then '' else coalesce(p.contact_email, '') end,
    'phone', case when for_public then '' else coalesce(p.phone, '') end,
    'hasContact', p.contact_email is not null or p.phone is not null,
    'about', coalesce(p.about, ''),
    'isFreelance', p.is_freelance,
    'availability', case when for_public and not p.is_freelance then 'unspecified' else p.availability end,
    'availableFrom', case when for_public and not p.is_freelance then null else p.available_from end,
    'workModes', case when for_public and not p.is_freelance then '[]'::jsonb else to_jsonb(p.work_modes) end,
    'travelZone', case when for_public and not p.is_freelance then '' else coalesce(p.travel_zone, '') end,
    'dailyRate', case when for_public and not p.is_freelance then null else p.daily_rate end,
    'sectionOrder', to_jsonb(p.section_order),
    'links', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'url', l.url, 'label', coalesce(l.label, '')) order by l.position)
      from public.profile_links l where l.user_id = p.id
    ), '[]'::jsonb),
    'services', case when for_public and not p.is_freelance then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'description', coalesce(s.description, '')) order by s.position)
      from public.profile_services s where s.user_id = p.id
    ), '[]'::jsonb) end,
    'experiences', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id,
        'title', e.title,
        'company', coalesce(e.company, ''),
        'location', coalesce(e.location, ''),
        'employmentType', e.employment_type,
        'workMode', e.work_mode,
        'start', jsonb_build_object('year', e.start_year, 'month', e.start_month),
        'end', case when e.end_year is null then null else jsonb_build_object('year', e.end_year, 'month', e.end_month) end,
        'isCurrent', e.is_current,
        'description', coalesce(e.description, ''),
        'skills', coalesce((
          select jsonb_agg(sk.name order by es.position)
          from public.profile_experience_skills es
          join public.profile_skills sk on sk.id = es.skill_id
          where es.experience_id = e.id
        ), '[]'::jsonb)
      ) order by e.position)
      from public.profile_experiences e where e.user_id = p.id
    ), '[]'::jsonb),
    'educations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id,
        'school', d.school,
        'degree', coalesce(d.degree, ''),
        'field', coalesce(d.field, ''),
        'start', case when d.start_year is null then null else jsonb_build_object('year', d.start_year, 'month', d.start_month) end,
        'end', case when d.end_year is null then null else jsonb_build_object('year', d.end_year, 'month', d.end_month) end,
        'isCurrent', d.is_current,
        'description', coalesce(d.description, '')
      ) order by d.position)
      from public.profile_educations d where d.user_id = p.id
    ), '[]'::jsonb),
    'certifications', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'issuer', coalesce(c.issuer, ''),
        'credentialId', coalesce(c.credential_id, ''),
        'issued', case when c.issued_year is null then null else jsonb_build_object('year', c.issued_year, 'month', c.issued_month) end,
        'expires', case when c.expires_year is null then null else jsonb_build_object('year', c.expires_year, 'month', c.expires_month) end,
        'verificationUrl', coalesce(c.verification_url, '')
      ) order by c.position)
      from public.profile_certifications c where c.user_id = p.id
    ), '[]'::jsonb),
    'projects', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pr.id,
        'name', pr.name,
        'description', coalesce(pr.description, ''),
        'start', case when pr.start_year is null then null else jsonb_build_object('year', pr.start_year, 'month', pr.start_month) end,
        'end', case when pr.end_year is null then null else jsonb_build_object('year', pr.end_year, 'month', pr.end_month) end,
        'isCurrent', pr.is_current,
        'url', coalesce(pr.url, ''),
        'experienceId', pr.experience_id,
        'images', coalesce((
          select jsonb_agg(i.url order by i.position)
          from public.profile_project_images i where i.project_id = pr.id
        ), '[]'::jsonb),
        'skills', coalesce((
          select jsonb_agg(sk.name order by ps.position)
          from public.profile_project_skills ps
          join public.profile_skills sk on sk.id = ps.skill_id
          where ps.project_id = pr.id
        ), '[]'::jsonb)
      ) order by pr.position)
      from public.profile_projects pr where pr.user_id = p.id
    ), '[]'::jsonb),
    'skills', coalesce((
      select jsonb_agg(jsonb_build_object('id', sk.id, 'name', sk.name, 'featured', sk.is_featured) order by sk.position)
      from public.profile_skills sk where sk.user_id = p.id
    ), '[]'::jsonb),
    'languages', coalesce((
      select jsonb_agg(jsonb_build_object('id', la.id, 'name', la.name, 'level', la.level) order by la.position)
      from public.profile_languages la where la.user_id = p.id
    ), '[]'::jsonb),
    'recommendations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'text', r.text,
        'author', r.author,
        'authorRole', coalesce(r.author_role, ''),
        'authorCompany', coalesce(r.author_company, ''),
        'authorUrl', coalesce(r.author_url, ''),
        'date', case when r.given_year is null then null else jsonb_build_object('year', r.given_year, 'month', r.given_month) end
      ) order by r.position)
      from public.profile_recommendations r where r.user_id = p.id
    ), '[]'::jsonb)
  )
  from public.profiles p
  where p.id = target;
$$;

-- Public read of a profile, open to anonymous visitors, with the same rules as get_public_profile:
-- an online profile for everyone, an offline one for its owner only (preview of the public page).
create function public.get_public_profile_content(profile_handle text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.profile_content(p.id, true)
  from public.profiles p
  where p.handle = profile_handle
    and (p.is_online or p.id = (select auth.uid()));
$$;

-- "Me contacter": the contact email and the phone, read only when a visitor clicks, so that they
-- are never in the page itself. Same rules.
create function public.get_public_profile_contact(profile_handle text)
returns table (email text, phone text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.contact_email, p.phone
  from public.profiles p
  where p.handle = profile_handle
    and (p.is_online or p.id = (select auth.uid()));
$$;

-- "Mon profil": the signed-in user's whole profile, contact details included.
create function public.get_own_profile_content()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.profile_content((select auth.uid()), false);
$$;

-- ——— Saving ———

-- "Enregistrer" in "Mon profil": the whole profile at once, in one transaction. The single fields
-- are updated; each list is replaced by the one received (ids kept, so that projects keep their
-- experience and images). The app cleans the values first (src/lib/profile/content.ts); the
-- constraints of the tables check them again, and the limits per list are checked here.
create function public.save_own_profile(content jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  limits constant jsonb := '{"links": 10, "services": 10, "experiences": 50, "educations": 20,
    "certifications": 30, "projects": 30, "skills": 50, "languages": 10, "recommendations": 20}';
  list_name text;
  max_items integer;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  for list_name, max_items in select key, value::integer from jsonb_each_text(limits) loop
    if coalesce(jsonb_typeof(content -> list_name), 'missing') <> 'array' then
      raise exception 'invalid_content' using detail = format('"%s" must be a list.', list_name);
    end if;
    if jsonb_array_length(content -> list_name) > max_items then
      raise exception 'too_many_items' using detail = format('"%s": %s at most.', list_name, max_items);
    end if;
  end loop;
  if exists (
    select 1 from jsonb_array_elements(content -> 'projects') pr
    where jsonb_array_length(coalesce(pr -> 'images', '[]')) > 5
  ) then
    raise exception 'too_many_items' using detail = 'Projects: 5 images at most.';
  end if;
  if (select count(*) from jsonb_array_elements(content -> 'skills') sk where (sk ->> 'featured')::boolean) > 5 then
    raise exception 'too_many_items' using detail = 'Featured skills: 5 at most.';
  end if;

  update public.profiles set
    first_name = nullif(content ->> 'firstName', ''),
    last_name = nullif(content ->> 'lastName', ''),
    headline = nullif(content ->> 'headline', ''),
    location = nullif(content ->> 'location', ''),
    photo_url = nullif(content ->> 'photoUrl', ''),
    contact_email = nullif(content ->> 'contactEmail', ''),
    phone = nullif(content ->> 'phone', ''),
    about = nullif(content ->> 'about', ''),
    is_freelance = coalesce((content ->> 'isFreelance')::boolean, true),
    availability = coalesce(content ->> 'availability', 'unspecified'),
    available_from = (content ->> 'availableFrom')::date,
    work_modes = array(select jsonb_array_elements_text(coalesce(content -> 'workModes', '[]'))),
    travel_zone = nullif(content ->> 'travelZone', ''),
    daily_rate = (content ->> 'dailyRate')::integer,
    section_order = array(select jsonb_array_elements_text(content -> 'sectionOrder'))
  where id = uid;

  -- Lists: removed, then written again. Projects go before the experiences and skills they use.
  delete from public.profile_projects where user_id = uid;
  delete from public.profile_experiences where user_id = uid;
  delete from public.profile_skills where user_id = uid;
  delete from public.profile_links where user_id = uid;
  delete from public.profile_services where user_id = uid;
  delete from public.profile_educations where user_id = uid;
  delete from public.profile_certifications where user_id = uid;
  delete from public.profile_languages where user_id = uid;
  delete from public.profile_recommendations where user_id = uid;

  insert into public.profile_links (id, user_id, position, url, label)
  select (x ->> 'id')::uuid, uid, n, x ->> 'url', nullif(x ->> 'label', '')
  from jsonb_array_elements(content -> 'links') with ordinality as t(x, n);

  insert into public.profile_services (id, user_id, position, name, description)
  select (x ->> 'id')::uuid, uid, n, x ->> 'name', nullif(x ->> 'description', '')
  from jsonb_array_elements(content -> 'services') with ordinality as t(x, n);

  insert into public.profile_skills (id, user_id, position, name, is_featured)
  select (x ->> 'id')::uuid, uid, n, x ->> 'name', coalesce((x ->> 'featured')::boolean, false)
  from jsonb_array_elements(content -> 'skills') with ordinality as t(x, n);

  insert into public.profile_experiences (
    id, user_id, position, title, company, location, employment_type, work_mode,
    start_year, start_month, end_year, end_month, is_current, description
  )
  select (x ->> 'id')::uuid, uid, n, x ->> 'title', nullif(x ->> 'company', ''), nullif(x ->> 'location', ''),
    x ->> 'employmentType', x ->> 'workMode',
    (x -> 'start' ->> 'year')::smallint, (x -> 'start' ->> 'month')::smallint,
    (x -> 'end' ->> 'year')::smallint, (x -> 'end' ->> 'month')::smallint,
    coalesce((x ->> 'isCurrent')::boolean, false), nullif(x ->> 'description', '')
  from jsonb_array_elements(content -> 'experiences') with ordinality as t(x, n);

  insert into public.profile_educations (
    id, user_id, position, school, degree, field, start_year, start_month, end_year, end_month,
    is_current, description
  )
  select (x ->> 'id')::uuid, uid, n, x ->> 'school', nullif(x ->> 'degree', ''), nullif(x ->> 'field', ''),
    (x -> 'start' ->> 'year')::smallint, (x -> 'start' ->> 'month')::smallint,
    (x -> 'end' ->> 'year')::smallint, (x -> 'end' ->> 'month')::smallint,
    coalesce((x ->> 'isCurrent')::boolean, false), nullif(x ->> 'description', '')
  from jsonb_array_elements(content -> 'educations') with ordinality as t(x, n);

  insert into public.profile_certifications (
    id, user_id, position, name, issuer, credential_id, issued_year, issued_month,
    expires_year, expires_month, verification_url
  )
  select (x ->> 'id')::uuid, uid, n, x ->> 'name', nullif(x ->> 'issuer', ''), nullif(x ->> 'credentialId', ''),
    (x -> 'issued' ->> 'year')::smallint, (x -> 'issued' ->> 'month')::smallint,
    (x -> 'expires' ->> 'year')::smallint, (x -> 'expires' ->> 'month')::smallint,
    nullif(x ->> 'verificationUrl', '')
  from jsonb_array_elements(content -> 'certifications') with ordinality as t(x, n);

  insert into public.profile_projects (
    id, user_id, position, name, description, start_year, start_month, end_year, end_month,
    is_current, url, experience_id
  )
  select (x ->> 'id')::uuid, uid, n, x ->> 'name', nullif(x ->> 'description', ''),
    (x -> 'start' ->> 'year')::smallint, (x -> 'start' ->> 'month')::smallint,
    (x -> 'end' ->> 'year')::smallint, (x -> 'end' ->> 'month')::smallint,
    coalesce((x ->> 'isCurrent')::boolean, false), nullif(x ->> 'url', ''),
    -- Only one of the user's own experiences.
    (select e.id from public.profile_experiences e where e.id = (x ->> 'experienceId')::uuid and e.user_id = uid)
  from jsonb_array_elements(content -> 'projects') with ordinality as t(x, n);

  insert into public.profile_project_images (user_id, project_id, position, url)
  select uid, (x ->> 'id')::uuid, n, image
  from jsonb_array_elements(content -> 'projects') as t(x)
  cross join lateral jsonb_array_elements_text(coalesce(x -> 'images', '[]')) with ordinality as i(image, n);

  -- Skills used in an experience or a project, by name: the app has already added them to the list.
  insert into public.profile_experience_skills (experience_id, skill_id, user_id, position)
  select (x ->> 'id')::uuid, sk.id, uid, min(k.n)
  from jsonb_array_elements(content -> 'experiences') as t(x)
  cross join lateral jsonb_array_elements_text(coalesce(x -> 'skills', '[]')) with ordinality as k(name, n)
  join public.profile_skills sk on sk.user_id = uid and lower(sk.name) = lower(k.name)
  group by 1, 2;

  insert into public.profile_project_skills (project_id, skill_id, user_id, position)
  select (x ->> 'id')::uuid, sk.id, uid, min(k.n)
  from jsonb_array_elements(content -> 'projects') as t(x)
  cross join lateral jsonb_array_elements_text(coalesce(x -> 'skills', '[]')) with ordinality as k(name, n)
  join public.profile_skills sk on sk.user_id = uid and lower(sk.name) = lower(k.name)
  group by 1, 2;

  insert into public.profile_languages (id, user_id, position, name, level)
  select (x ->> 'id')::uuid, uid, n, x ->> 'name', x ->> 'level'
  from jsonb_array_elements(content -> 'languages') with ordinality as t(x, n);

  insert into public.profile_recommendations (
    id, user_id, position, text, author, author_role, author_company, author_url, given_year, given_month
  )
  select (x ->> 'id')::uuid, uid, n, x ->> 'text', x ->> 'author', nullif(x ->> 'authorRole', ''),
    nullif(x ->> 'authorCompany', ''), nullif(x ->> 'authorUrl', ''),
    (x -> 'date' ->> 'year')::smallint, (x -> 'date' ->> 'month')::smallint
  from jsonb_array_elements(content -> 'recommendations') with ordinality as t(x, n);
end;
$$;

-- ——— Images: photo and project images ———
-- One folder per user (named after their id), where only they can write. Public read by address,
-- with file names nobody can guess (docs/profile.md, "Fichiers").
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-images', 'profile-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Users can add images to their own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Listing, to remove the images no longer used and those of a deleted account.
create policy "Users can list their own images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can remove their own images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ——— Access ———
-- Nothing is callable through the API by default: the public reads are opened to everyone, the
-- own read and the save to signed-in users.
revoke execute on function public.google_photo_url(jsonb) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.profile_content(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.get_public_profile_content(text) from public;
revoke execute on function public.get_public_profile_contact(text) from public;
revoke execute on function public.get_own_profile_content() from public, anon;
revoke execute on function public.save_own_profile(jsonb) from public, anon;
grant execute on function public.get_public_profile_content(text) to anon, authenticated;
grant execute on function public.get_public_profile_contact(text) to anon, authenticated;
grant execute on function public.get_own_profile_content() to authenticated;
grant execute on function public.save_own_profile(jsonb) to authenticated;
