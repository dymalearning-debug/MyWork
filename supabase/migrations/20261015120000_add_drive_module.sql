-- Drive module (see docs/drive.md, "Données"): folders and files of "Mes fichiers". Each file is
-- private by default; a public one is listed in the "Ressources" tab of the public profile, and one
-- of them can be featured there.
-- The app writes straight into the table (RLS limits every read and write to the user's own rows);
-- triggers check the rules: unique names in a folder, 10 levels of folders, the storage capacity.
-- The files themselves are in the private "drive-files" bucket, flat, under "<user id>/<item id>":
-- renaming or moving an item only changes the table.

-- ——— Capacity ———
-- The one place where the capacity is written: 1 GB, the storage of the Supabase free plan
-- (docs/drive.md, "Indicateur de stockage"). It will become the quota of the subscription.
create function public.storage_capacity()
returns bigint
language sql
immutable
set search_path = ''
as $$
  select 1073741824::bigint;
$$;

-- Space used by a user: the size of every file of their folder, in every bucket.
create function public.storage_used(owner uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum((o.metadata ->> 'size')::bigint), 0)::bigint
  from storage.objects o
  where o.bucket_id in ('profile-images', 'board-images', 'drive-files')
    and o.name like owner::text || '/%';
$$;

-- ——— Items ———
-- kind: "folder" or "file". parent_id: the folder holding the item, null for "Mes fichiers".
-- search_name: the name without accents and in lowercase, for the search (kept by the trigger).
-- For a file: its category (filter "Type"), its MIME type, its size, whether it has a thumbnail,
-- whether its upload is over (a row is created before its file is sent, see below), its visibility
-- and whether it is featured.
create table public.drive_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  parent_id uuid,
  kind text not null check (kind in ('folder', 'file')),
  name text not null check (char_length(name) between 1 and 120 and btrim(name) <> ''),
  search_name text not null default '',
  category text not null check (
    category in ('folder', 'document', 'spreadsheet', 'presentation', 'image', 'video', 'audio', 'archive', 'other')
  ),
  mime_type text check (char_length(mime_type) <= 255),
  size bigint check (size between 0 and 52428800),
  has_thumbnail boolean not null default false,
  is_uploaded boolean not null default false,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (parent_id, user_id) references public.drive_items (id, user_id) on delete cascade,
  -- A folder has no size, no type and no visibility.
  constraint drive_items_folder_shape check (
    kind = 'file' or (
      category = 'folder' and size is null and mime_type is null and visibility = 'private'
      and not is_featured and not has_thumbnail
    )
  ),
  constraint drive_items_file_shape check (kind = 'folder' or (category <> 'folder' and size is not null)),
  -- Only a public file can be featured.
  constraint drive_items_featured_public check (not is_featured or visibility = 'public'),
  -- Programs are refused (same list as src/lib/drive/files.ts).
  constraint drive_items_no_executable check (
    kind = 'folder'
    or lower(name) !~ '\.(exe|msi|bat|cmd|com|scr|pif|ps1|vbs|sh|apk|dmg|pkg|deb|rpm|jar)$'
  )
);

-- Two items of a folder never have the same name (whatever the case).
create unique index drive_items_name_key
  on public.drive_items (user_id, parent_id, lower(name)) nulls not distinct;
-- One featured file per user.
create unique index drive_items_featured_key on public.drive_items (user_id) where is_featured;
create index drive_items_parent_id_idx on public.drive_items (parent_id, user_id);

-- ——— Rules ———
-- Before each addition or change: the search name; the date of change (the upload and the
-- renaming change it, not a move nor the visibility); a private file loses its featuring; the
-- parent must be a folder, never the item itself or one of its subfolders; 10 levels of folders at
-- most; a new file must fit in the capacity, counting the uploads still in progress. Runs as its
-- owner: it reads every row of the user. The error message tells the app which rule was broken.
create function public.check_drive_item()
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

create trigger drive_items_check before insert or update on public.drive_items
  for each row execute function public.check_drive_item();

-- ——— Uploads ———
-- Order of an upload (docs/drive.md, "Technique"): the row first (the trigger checks the capacity),
-- then the file, sent straight from the browser to the storage (which only accepts the file of a
-- row still waiting for it), then this function, which checks that the file is there, records its
-- real size and shows the item. 'storage_full': the file turned out larger than announced and does
-- not fit; its row is removed, the app removes the file.
create function public.complete_drive_upload(item_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  item record;
  actual bigint;
  pending bigint;
begin
  select id, user_id, size into item
  from public.drive_items
  where id = item_id and user_id = (select auth.uid()) and kind = 'file' and not is_uploaded
  for update;
  if not found then
    raise exception 'drive_item_not_found';
  end if;

  select (metadata ->> 'size')::bigint into actual
  from storage.objects
  where bucket_id = 'drive-files' and name = item.user_id::text || '/' || item.id::text;
  if actual is null then
    raise exception 'drive_upload_missing';
  end if;

  if actual > item.size then
    select coalesce(sum(size), 0) into pending
    from public.drive_items
    where user_id = item.user_id and kind = 'file' and not is_uploaded and id <> item.id;
    if public.storage_used(item.user_id) + pending > public.storage_capacity() then
      delete from public.drive_items where id = item.id;
      return 'storage_full';
    end if;
  end if;

  update public.drive_items
  set is_uploaded = true,
      size = actual,
      has_thumbnail = exists (
        select 1 from storage.objects
        where bucket_id = 'drive-files' and name = item.user_id::text || '/' || item.id::text || '-thumb.webp'
      ),
      updated_at = now()
  where id = item.id;
  return 'ok';
end;
$$;

-- ——— Reads of "Mes fichiers" ———
-- They run as the user: RLS applies.

-- The folders from "Mes fichiers" to the given one (breadcrumb), the root first.
create function public.drive_folder_path(folder_id uuid)
returns table (id uuid, name text)
language sql
stable
set search_path = ''
as $$
  with recursive chain as (
    select d.id, d.name, d.parent_id, 1 as distance
    from public.drive_items d
    where d.id = folder_id and d.kind = 'folder'
    union all
    select p.id, p.name, p.parent_id, chain.distance + 1
    from public.drive_items p join chain on p.id = chain.parent_id
  )
  select chain.id, chain.name from chain order by chain.distance desc;
$$;

-- The given items and everything inside them: what a deletion takes away (the confirmation counts
-- it, the app removes the files from the storage).
create function public.drive_subtree(item_ids uuid[])
returns table (id uuid, kind text, has_thumbnail boolean)
language sql
stable
set search_path = ''
as $$
  with recursive subtree as (
    select d.id, d.kind, d.has_thumbnail from public.drive_items d where d.id = any (item_ids)
    union
    select child.id, child.kind, child.has_thumbnail
    from public.drive_items child join subtree on child.parent_id = subtree.id
  )
  select subtree.id, subtree.kind, subtree.has_thumbnail from subtree;
$$;

-- "Mettre en avant" / "Retirer la mise en avant": one featured file at a time, the new one replaces
-- the former. The file must be public (checked by the table).
create function public.set_drive_featured(item_id uuid, featured boolean)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if featured then
    update public.drive_items set is_featured = false
    where user_id = (select auth.uid()) and is_featured and id <> item_id;
  end if;
  update public.drive_items set is_featured = featured where id = item_id;
end;
$$;

-- The storage indicator: the space used in each bucket of the user's folder, and the capacity.
create function public.get_own_storage_usage()
returns table (drive bigint, profile bigint, boards bigint, capacity bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(sum(size) filter (where bucket_id = 'drive-files'), 0)::bigint,
    coalesce(sum(size) filter (where bucket_id = 'profile-images'), 0)::bigint,
    coalesce(sum(size) filter (where bucket_id = 'board-images'), 0)::bigint,
    public.storage_capacity()
  from (
    select o.bucket_id, (o.metadata ->> 'size')::bigint as size
    from storage.objects o
    where o.bucket_id in ('profile-images', 'board-images', 'drive-files')
      and (select auth.uid()) is not null
      and o.name like (select auth.uid())::text || '/%'
  ) as files;
$$;

-- ——— Public reads ———
-- Open to anonymous visitors, with the same rules as the public profile: an online profile for
-- everyone, an offline one for its owner only (preview). Only the public files, flat: never their
-- folder.

-- The "Ressources" tab: the featured file, and one page of the others, the most recent first.
-- null: no such profile (or offline).
create function public.get_public_drive_resources(profile_handle text, page_offset integer, page_limit integer)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with owner as (
    select p.id from public.profiles p
    where p.handle = profile_handle and (p.is_online or p.id = (select auth.uid()))
  ),
  files as (
    select
      d.id, d.name, d.category, d.mime_type, d.size, d.updated_at, d.is_featured,
      case when d.has_thumbnail then d.user_id::text || '/' || d.id::text || '-thumb.webp' end as thumbnail_path
    from public.drive_items d join owner on d.user_id = owner.id
    where d.kind = 'file' and d.is_uploaded and d.visibility = 'public'
  ),
  shown as (
    select * from files where not is_featured
    order by updated_at desc, id
    offset greatest(page_offset, 0) limit least(greatest(page_limit, 1), 100)
  )
  select jsonb_build_object(
    'featured', (
      select jsonb_build_object(
        'id', f.id, 'name', f.name, 'category', f.category, 'mimeType', f.mime_type, 'size', f.size,
        'updatedAt', f.updated_at, 'thumbnailPath', f.thumbnail_path
      )
      from files f where f.is_featured
    ),
    'total', (select count(*) from files where not is_featured),
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', s.id, 'name', s.name, 'category', s.category, 'mimeType', s.mime_type, 'size', s.size,
            'updatedAt', s.updated_at, 'thumbnailPath', s.thumbnail_path
          )
          order by s.updated_at desc, s.id
        )
        from shown s
      ),
      '[]'::jsonb
    )
  )
  from owner;
$$;

-- One public file, for its download: its place in the storage and its name.
create function public.get_public_drive_file(profile_handle text, item_id uuid)
returns table (path text, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select d.user_id::text || '/' || d.id::text, d.name
  from public.drive_items d
  join public.profiles p on p.id = d.user_id
  where p.handle = profile_handle
    and (p.is_online or p.id = (select auth.uid()))
    and d.id = item_id and d.kind = 'file' and d.is_uploaded and d.visibility = 'public';
$$;

-- Rule of the storage for visitors: a file (or its thumbnail) of the "drive-files" bucket can be
-- read only when it is public and its profile is online.
create function public.is_public_drive_object(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  file_name text := split_part(object_name, '/', 2);
  item_id uuid;
begin
  if split_part(object_name, '/', 3) <> '' then
    return false;
  end if;
  if file_name ~ '^[0-9a-f-]{36}-thumb\.webp$' then
    file_name := left(file_name, 36);
  end if;
  if file_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  item_id := file_name::uuid;
  return exists (
    select 1
    from public.drive_items d
    join public.profiles p on p.id = d.user_id
    where d.id = item_id
      and d.user_id::text = split_part(object_name, '/', 1)
      and d.kind = 'file' and d.is_uploaded and d.visibility = 'public'
      and p.is_online
  );
end;
$$;

-- ——— Access ———
-- RLS: each user reads and changes only their own items. Only the columns the app writes can be
-- given; whether an upload is over, the real size and the thumbnail are set by
-- complete_drive_upload(). The administrator role (end-to-end tests) has full access.
alter table public.drive_items enable row level security;

create policy "Users can read their own items"
  on public.drive_items for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own items"
  on public.drive_items for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can change their own items"
  on public.drive_items for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own items"
  on public.drive_items for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.drive_items from anon, authenticated;
grant select, delete on public.drive_items to authenticated;
grant insert (id, parent_id, kind, name, category, mime_type, size) on public.drive_items to authenticated;
grant update (name, parent_id, visibility, is_featured) on public.drive_items to authenticated;
grant select, insert, update, delete on public.drive_items to service_role;

revoke execute on function public.storage_capacity() from public, anon, authenticated;
revoke execute on function public.storage_used(uuid) from public, anon, authenticated;
revoke execute on function public.check_drive_item() from public, anon, authenticated;
revoke execute on function public.complete_drive_upload(uuid) from public, anon;
revoke execute on function public.drive_folder_path(uuid) from public, anon;
revoke execute on function public.drive_subtree(uuid[]) from public, anon;
revoke execute on function public.set_drive_featured(uuid, boolean) from public, anon;
revoke execute on function public.get_own_storage_usage() from public, anon;
revoke execute on function public.get_public_drive_resources(text, integer, integer) from public;
revoke execute on function public.get_public_drive_file(text, uuid) from public;
revoke execute on function public.is_public_drive_object(text) from public;
grant execute on function public.complete_drive_upload(uuid) to authenticated;
grant execute on function public.drive_folder_path(uuid) to authenticated;
grant execute on function public.drive_subtree(uuid[]) to authenticated;
grant execute on function public.set_drive_featured(uuid, boolean) to authenticated;
grant execute on function public.get_own_storage_usage() to authenticated;
grant execute on function public.get_public_drive_resources(text, integer, integer) to anon, authenticated;
grant execute on function public.get_public_drive_file(text, uuid) to anon, authenticated;
grant execute on function public.is_public_drive_object(text) to anon, authenticated;

-- ——— Files ———
-- Private bucket, 50 MB per file, every type (programs are refused by the app and the table).
-- One folder per user: they read and remove there; they add a file only for a row of theirs still
-- waiting for its file (or its thumbnail), so the capacity checked by the table always applies.
-- Visitors read public files of online profiles, through short signed addresses.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('drive-files', 'drive-files', false, 52428800, null)
on conflict (id) do nothing;

create policy "Users can add drive files for their pending items"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'drive-files'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and split_part(name, '/', 3) = ''
    and exists (
      select 1 from public.drive_items d
      where d.user_id = (select auth.uid())
        and d.kind = 'file'
        and not d.is_uploaded
        and (d.id::text = split_part(name, '/', 2) or d.id::text || '-thumb.webp' = split_part(name, '/', 2))
    )
  );

create policy "Users can read their own drive files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'drive-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can remove their own drive files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'drive-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Anyone can read public drive files of online profiles"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'drive-files' and public.is_public_drive_object(name));
