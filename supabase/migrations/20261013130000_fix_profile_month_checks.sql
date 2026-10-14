-- Profil module: the checks "a month needs a year" of the previous migration refused an empty month
-- when the year was empty too (null and false is false in SQL). Written again with "is null or".

do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conrelid::regclass as table_name, conname
    from pg_constraint
    where contype = 'c'
      and conrelid in (
        'public.profile_experiences'::regclass, 'public.profile_educations'::regclass,
        'public.profile_certifications'::regclass, 'public.profile_projects'::regclass,
        'public.profile_recommendations'::regclass
      )
      and pg_get_constraintdef(oid) ~ '_month'
      and pg_get_constraintdef(oid) ~ '_year IS NOT NULL'
  loop
    execute format('alter table %s drop constraint %I', constraint_row.table_name, constraint_row.conname);
  end loop;
end;
$$;

alter table public.profile_experiences
  add constraint profile_experiences_end_month_needs_year check (end_month is null or end_year is not null);

alter table public.profile_educations
  add constraint profile_educations_start_month_needs_year check (start_month is null or start_year is not null),
  add constraint profile_educations_end_month_needs_year check (end_month is null or end_year is not null);

alter table public.profile_certifications
  add constraint profile_certifications_issued_month_needs_year check (issued_month is null or issued_year is not null),
  add constraint profile_certifications_expires_month_needs_year check (expires_month is null or expires_year is not null);

alter table public.profile_projects
  add constraint profile_projects_start_month_needs_year check (start_month is null or start_year is not null),
  add constraint profile_projects_end_month_needs_year check (end_month is null or end_year is not null);

alter table public.profile_recommendations
  add constraint profile_recommendations_given_month_needs_year check (given_month is null or given_year is not null);

-- The month itself, between 1 and 12 (the dropped checks held this rule too).
alter table public.profile_experiences
  add constraint profile_experiences_end_month_range check (end_month between 1 and 12);

alter table public.profile_educations
  add constraint profile_educations_start_month_range check (start_month between 1 and 12),
  add constraint profile_educations_end_month_range check (end_month between 1 and 12);

alter table public.profile_certifications
  add constraint profile_certifications_issued_month_range check (issued_month between 1 and 12),
  add constraint profile_certifications_expires_month_range check (expires_month between 1 and 12);

alter table public.profile_projects
  add constraint profile_projects_start_month_range check (start_month between 1 and 12),
  add constraint profile_projects_end_month_range check (end_month between 1 and 12);

alter table public.profile_recommendations
  add constraint profile_recommendations_given_month_range check (given_month between 1 and 12);
