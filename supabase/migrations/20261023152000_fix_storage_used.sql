-- The storage used by one account (security audit of 2026-10-23).
--
-- In storage_used, "owner" was read as the column storage.objects.owner (the account that wrote
-- the file), not as the parameter: in a SQL function, a column wins over a parameter of the same
-- name. Every file sits in the folder of the account that wrote it, so the function added up the
-- files of all the accounts: the capacity of 1 GB was shared by everyone, and the dashboard showed
-- the storage of the whole of MyWork. The parameter is now named in full.

create or replace function public.storage_used(owner uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum((o.metadata ->> 'size')::bigint), 0)::bigint
  from storage.objects o
  where o.bucket_id in ('profile-images', 'board-images', 'drive-files')
    and o.name like storage_used.owner::text || '/%';
$$;

revoke execute on function public.storage_used(uuid) from public, anon, authenticated;
