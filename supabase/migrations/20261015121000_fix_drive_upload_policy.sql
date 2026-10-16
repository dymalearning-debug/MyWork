-- The rule for adding a file to "drive-files" compared the name of the item with itself: inside
-- the subquery, "name" was the column of drive_items, not the name of the stored object. Every
-- upload was refused. Same rule, with the object's name spelled out.
drop policy "Users can add drive files for their pending items" on storage.objects;

create policy "Users can add drive files for their pending items"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'drive-files'
    and split_part(objects.name, '/', 1) = (select auth.uid())::text
    and split_part(objects.name, '/', 3) = ''
    and exists (
      select 1 from public.drive_items d
      where d.user_id = (select auth.uid())
        and d.kind = 'file'
        and not d.is_uploaded
        and (
          d.id::text = split_part(objects.name, '/', 2)
          or d.id::text || '-thumb.webp' = split_part(objects.name, '/', 2)
        )
    )
  );
