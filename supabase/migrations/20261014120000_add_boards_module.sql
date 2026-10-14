-- Tableaux module (see docs/boards.md, "Données"): private kanban boards. Boards hold lists, lists
-- hold cards, cards hold a checklist and images. Everything is private to its owner.
-- The app writes straight into the tables, one row at a time (everything is saved as it changes):
-- RLS limits every read and write to the user's own rows, and triggers check the limits.
-- Rows that point to another row go through (id, user_id) keys: they can only point to a row of
-- the same user. Positions are decimal numbers, to insert a row between two others.

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60 and btrim(name) <> ''),
  position double precision not null,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.board_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  board_id uuid not null,
  name text not null check (char_length(name) between 1 and 50 and btrim(name) <> ''),
  position double precision not null,
  unique (id, user_id),
  foreign key (board_id, user_id) references public.boards (id, user_id) on delete cascade
);

create table public.board_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  list_id uuid not null,
  title text not null check (char_length(title) between 1 and 200 and btrim(title) <> ''),
  description text not null default '' check (char_length(description) <= 10000),
  position double precision not null,
  -- The image shown on top of the card in its list; null: no cover.
  cover_image_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (list_id, user_id) references public.board_lists (id, user_id) on delete cascade
);

create table public.board_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  card_id uuid not null,
  text text not null check (char_length(text) between 1 and 200 and btrim(text) <> ''),
  is_done boolean not null default false,
  position double precision not null,
  foreign key (card_id, user_id) references public.board_cards (id, user_id) on delete cascade
);

-- path: the file in the "board-images" bucket, in the user's folder ("<user id>/<name>").
create table public.board_card_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  card_id uuid not null,
  path text not null unique check (char_length(path) <= 300 and split_part(path, '/', 1) = user_id::text),
  position double precision not null,
  unique (id, user_id),
  foreign key (card_id, user_id) references public.board_cards (id, user_id) on delete cascade
);

-- The cover is one of the user's images; it goes back to null when the image is deleted.
alter table public.board_cards
  add foreign key (cover_image_id, user_id)
    references public.board_card_images (id, user_id) on delete set null (cover_image_id);

create index boards_user_id_idx on public.boards (user_id);
create index board_lists_board_id_idx on public.board_lists (board_id, user_id);
create index board_cards_list_id_idx on public.board_cards (list_id, user_id);
create index board_cards_cover_image_id_idx on public.board_cards (cover_image_id, user_id);
create index board_checklist_items_card_id_idx on public.board_checklist_items (card_id, user_id);
create index board_card_images_card_id_idx on public.board_card_images (card_id, user_id);

-- ——— Limits ———
-- 10 boards per account, 5 lists per board, 20 cards per list, 20 checklist items and 5 images per
-- card (docs/boards.md). The parent row is locked first, so that two additions at the same moment
-- cannot both pass. The error message tells the app which limit was reached.

create function public.check_board_limits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'boards' then
    perform 1 from public.profiles where id = new.user_id for update;
    if (select count(*) from public.boards where user_id = new.user_id) >= 10 then
      raise exception 'board_limit_reached';
    end if;
  elsif tg_table_name = 'board_lists' then
    perform 1 from public.boards where id = new.board_id for update;
    if (select count(*) from public.board_lists where board_id = new.board_id) >= 5 then
      raise exception 'list_limit_reached';
    end if;
  elsif tg_table_name = 'board_cards' then
    -- A card moved within its list does not count twice.
    if tg_op = 'UPDATE' and new.list_id = old.list_id then
      return new;
    end if;
    perform 1 from public.board_lists where id = new.list_id for update;
    if (select count(*) from public.board_cards where list_id = new.list_id) >= 20 then
      raise exception 'card_limit_reached';
    end if;
  elsif tg_table_name = 'board_checklist_items' then
    perform 1 from public.board_cards where id = new.card_id for update;
    if (select count(*) from public.board_checklist_items where card_id = new.card_id) >= 20 then
      raise exception 'checklist_limit_reached';
    end if;
  elsif tg_table_name = 'board_card_images' then
    perform 1 from public.board_cards where id = new.card_id for update;
    if (select count(*) from public.board_card_images where card_id = new.card_id) >= 5 then
      raise exception 'image_limit_reached';
    end if;
  end if;
  return new;
end;
$$;

create trigger boards_limit before insert on public.boards
  for each row execute function public.check_board_limits();
create trigger board_lists_limit before insert on public.board_lists
  for each row execute function public.check_board_limits();
create trigger board_cards_limit before insert or update of list_id on public.board_cards
  for each row execute function public.check_board_limits();
create trigger board_checklist_items_limit before insert on public.board_checklist_items
  for each row execute function public.check_board_limits();
create trigger board_card_images_limit before insert on public.board_card_images
  for each row execute function public.check_board_limits();

-- Date of the last change of a card.
create function public.touch_board_card()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger board_cards_touch before update on public.board_cards
  for each row execute function public.touch_board_card();

-- ——— A new board ———
-- Created with three lists to start with, "À faire", "En cours", "Terminé", at the end of the
-- user's boards. Runs as the user: RLS and the limits apply.
create function public.create_board(board_name text)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into public.boards (name, position)
  values (
    board_name,
    coalesce((select max(position) from public.boards where user_id = (select auth.uid())), 0) + 1024
  )
  returning id into new_id;
  insert into public.board_lists (board_id, name, position)
  values (new_id, 'À faire', 1024), (new_id, 'En cours', 2048), (new_id, 'Terminé', 3072);
  return new_id;
end;
$$;

-- ——— Access ———
-- RLS: each user reads and changes only their own rows. Only the columns the app changes can be
-- updated. The administrator role (end-to-end tests) has full access.
do $$
declare
  board_table text;
begin
  foreach board_table in array array[
    'boards', 'board_lists', 'board_cards', 'board_checklist_items', 'board_card_images'
  ] loop
    execute format('alter table public.%I enable row level security', board_table);
    execute format(
      'create policy "Users can read their own rows" on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      board_table
    );
    execute format(
      'create policy "Users can add their own rows" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      board_table
    );
    execute format(
      'create policy "Users can change their own rows" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      board_table
    );
    execute format(
      'create policy "Users can delete their own rows" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      board_table
    );
    execute format('revoke all on public.%I from anon, authenticated', board_table);
    execute format('grant select, insert, delete on public.%I to authenticated', board_table);
    execute format('grant select, insert, update, delete on public.%I to service_role', board_table);
  end loop;
end;
$$;

grant update (name, position) on public.boards to authenticated;
grant update (name, position) on public.board_lists to authenticated;
grant update (list_id, title, description, position, cover_image_id) on public.board_cards to authenticated;
grant update (text, is_done, position) on public.board_checklist_items to authenticated;
grant update (position) on public.board_card_images to authenticated;

revoke execute on function public.check_board_limits() from public, anon, authenticated;
revoke execute on function public.touch_board_card() from public, anon, authenticated;
revoke execute on function public.create_board(text) from public, anon;
grant execute on function public.create_board(text) to authenticated;

-- ——— Images of the cards ———
-- Private bucket: one folder per user (named after their id), where only they read and write.
-- Images are shown through signed addresses, valid for an hour (docs/boards.md, "Données").
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('board-images', 'board-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "Users can add board images to their own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'board-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can read their own board images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'board-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can remove their own board images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'board-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
