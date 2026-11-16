-- Marker · 0001_init
-- Esquema inicial: items, collections, tags + RLS por usuario.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- items
-- ---------------------------------------------------------------------------
create table public.items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  url           text not null,
  canonical_url text not null,
  platform      text not null default 'web',
  kind          text not null default 'link',
  title         text,
  description   text,
  author_name   text,
  thumbnail_url text,
  content_text  text,
  -- pending = enriquecimiento en curso · ready = procesado · error = fallo
  status        text not null default 'pending',
  error_message text,
  -- paste | share | extension | import | sync
  source        text not null default 'paste',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  saved_at      timestamptz not null default now(),
  unique (user_id, canonical_url)
);

create index items_user_saved_idx    on public.items (user_id, saved_at desc);
create index items_user_platform_idx on public.items (user_id, platform);
create index items_user_kind_idx     on public.items (user_id, kind);
create index items_user_status_idx   on public.items (user_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- collections
-- ---------------------------------------------------------------------------
create table public.collections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.item_collections (
  item_id       uuid not null references public.items (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  primary key (item_id, collection_id)
);

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------
create table public.tags (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name    text not null,
  unique (user_id, name)
);

create table public.item_tags (
  item_id uuid not null references public.items (id) on delete cascade,
  tag_id  uuid not null references public.tags (id) on delete cascade,
  primary key (item_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security · cada usuario solo accede a lo suyo
-- ---------------------------------------------------------------------------
alter table public.items             enable row level security;
alter table public.collections       enable row level security;
alter table public.item_collections  enable row level security;
alter table public.tags              enable row level security;
alter table public.item_tags         enable row level security;

create policy items_select on public.items
  for select to authenticated using (user_id = (select auth.uid()));
create policy items_insert on public.items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy items_update on public.items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy items_delete on public.items
  for delete to authenticated using (user_id = (select auth.uid()));

create policy collections_select on public.collections
  for select to authenticated using (user_id = (select auth.uid()));
create policy collections_insert on public.collections
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy collections_update on public.collections
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy collections_delete on public.collections
  for delete to authenticated using (user_id = (select auth.uid()));

create policy item_collections_select on public.item_collections
  for select to authenticated
  using (
    exists (
      select 1 from public.items i
      where i.id = item_collections.item_id
        and i.user_id = (select auth.uid())
    )
  );
create policy item_collections_insert on public.item_collections
  for insert to authenticated
  with check (
    exists (
      select 1 from public.items i
      where i.id = item_collections.item_id
        and i.user_id = (select auth.uid())
    )
  );
create policy item_collections_delete on public.item_collections
  for delete to authenticated
  using (
    exists (
      select 1 from public.items i
      where i.id = item_collections.item_id
        and i.user_id = (select auth.uid())
    )
  );

create policy tags_select on public.tags
  for select to authenticated using (user_id = (select auth.uid()));
create policy tags_insert on public.tags
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy tags_update on public.tags
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy tags_delete on public.tags
  for delete to authenticated using (user_id = (select auth.uid()));

create policy item_tags_select on public.item_tags
  for select to authenticated
  using (
    exists (
      select 1 from public.items i
      where i.id = item_tags.item_id
        and i.user_id = (select auth.uid())
    )
  );
create policy item_tags_insert on public.item_tags
  for insert to authenticated
  with check (
    exists (
      select 1 from public.items i
      where i.id = item_tags.item_id
        and i.user_id = (select auth.uid())
    )
  );
create policy item_tags_delete on public.item_tags
  for delete to authenticated
  using (
    exists (
      select 1 from public.items i
      where i.id = item_tags.item_id
        and i.user_id = (select auth.uid())
    )
  );
