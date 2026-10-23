-- Storage quota checked when the files are written (security audit of 2026-10-23).
--
-- Before, the capacity was only checked with the size the browser announces for a Drive file (a
-- file announced at 0 bytes could then weigh 50 MB, so the 1 GB could be passed without limit),
-- and the images of the profile and of the boards were never checked. Now:
--   - every file added to the three buckets needs room: what is stored, plus the Drive files being
--     uploaded (their announced size), within the capacity. A file being written when the account
--     reaches its capacity still goes through, the next ones are refused;
--   - 10 Drive files being uploaded at most per account, so that the files written at the same
--     moment stay few.

-- Whether the signed-in user still has room (the policy below).
create function public.has_storage_room()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and public.storage_used((select auth.uid())) + coalesce((
      select sum(d.size) from public.drive_items d
      where d.user_id = (select auth.uid()) and d.kind = 'file' and not d.is_uploaded
    ), 0) <= public.storage_capacity();
$$;

revoke execute on function public.has_storage_room() from public, anon;
grant execute on function public.has_storage_room() to authenticated;

create policy "Adding files needs room"
  on storage.objects as restrictive for insert
  to authenticated
  with check (
    bucket_id not in ('profile-images', 'board-images', 'drive-files') or (select public.has_storage_room())
  );

create or replace function public.check_drive_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_kind text;
  parent_level integer;
  subtree_height integer;
  pending bigint;
begin
  new.search_name := lower(extensions.unaccent(new.name));

  if tg_op = 'INSERT' then
    new.is_uploaded := new.kind = 'folder';
    new.created_at := now();
    new.updated_at := now();
  else
    if new.name is distinct from old.name then
      new.updated_at := now();
    end if;
    if new.visibility = 'private' then
      new.is_featured := false;
    end if;
  end if;

  if new.parent_id is not null and (tg_op = 'INSERT' or new.parent_id is distinct from old.parent_id) then
    select kind into parent_kind from public.drive_items where id = new.parent_id;
    if parent_kind is distinct from 'folder' then
      raise exception 'drive_parent_not_folder';
    end if;

    if tg_op = 'UPDATE' and new.kind = 'folder' then
      if exists (
        with recursive subtree as (
          select id from public.drive_items where id = new.id
          union all
          select child.id from public.drive_items child join subtree on child.parent_id = subtree.id
        )
        select 1 from subtree where id = new.parent_id
      ) then
        raise exception 'drive_move_into_itself';
      end if;
    end if;
  end if;

  if new.kind = 'folder' and (tg_op = 'INSERT' or new.parent_id is distinct from old.parent_id) then
    -- Level of the parent: 0 for "Mes fichiers", 1 for a folder at the root...
    with recursive chain as (
      select id, parent_id from public.drive_items where id = new.parent_id
      union all
      select p.id, p.parent_id from public.drive_items p join chain on p.id = chain.parent_id
    )
    select count(*) into parent_level from chain;
    -- Levels of the folder itself and of its subfolders.
    subtree_height := 1;
    if tg_op = 'UPDATE' then
      with recursive subtree as (
        select id, 1 as level from public.drive_items where id = new.id
        union all
        select child.id, subtree.level + 1
        from public.drive_items child join subtree on child.parent_id = subtree.id
        where child.kind = 'folder'
      )
      select max(level) into subtree_height from subtree;
    end if;
    if parent_level + subtree_height > 10 then
      raise exception 'drive_depth_limit_reached';
    end if;
  end if;

  if tg_op = 'INSERT' and new.kind = 'file' then
    -- Two uploads at the same moment wait for each other.
    perform 1 from public.profiles where id = new.user_id for update;
    -- 10 files being uploaded at most (the page sends 3 at a time): the files written at the same
    -- moment, before the storage counts them, stay few.
    if (
      select count(*) from public.drive_items
      where user_id = new.user_id and kind = 'file' and not is_uploaded
    ) >= 10 then
      raise exception 'drive_too_many_uploads';
    end if;
    select coalesce(sum(size), 0) into pending
    from public.drive_items
    where user_id = new.user_id and kind = 'file' and not is_uploaded;
    if public.storage_used(new.user_id) + pending + new.size > public.storage_capacity() then
      raise exception 'drive_storage_full';
    end if;
  end if;

  return new;
end;
$$;
