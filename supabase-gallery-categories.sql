-- Gallery categories CRUD support
-- Run in Supabase → SQL Editor

-- 1) Allow any category string on gallery items
alter table gallery_items drop constraint if exists gallery_items_category_check;

-- 2) Categories table
create table if not exists gallery_categories (
  id text primary key,
  label jsonb not null,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table gallery_categories enable row level security;

drop policy if exists "Allow public read access for gallery_categories" on gallery_categories;
create policy "Allow public read access for gallery_categories"
  on gallery_categories for select using (true);

drop policy if exists "Allow write access for gallery_categories" on gallery_categories;
create policy "Allow write access for gallery_categories"
  on gallery_categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 3) Seed defaults (safe to re-run)
insert into gallery_categories (id, label, sort_order) values
  ('clinic', '{"ar":"مساحة العيادة","en":"Boutique Space"}'::jsonb, 0),
  ('cases', '{"ar":"حالات تجميلية","en":"Smile Designs"}'::jsonb, 1)
on conflict (id) do nothing;
