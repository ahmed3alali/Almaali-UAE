-- Services, testimonials (customer ratings), and vision images CRUD
-- Run in Supabase → SQL Editor

-- 1) Services
create table if not exists services (
  id text primary key,
  icon_name text not null default 'Gem',
  title jsonb not null,
  description jsonb not null,
  details jsonb not null default '{"ar":[],"en":[]}'::jsonb,
  duration jsonb not null default '{"ar":"","en":""}'::jsonb,
  image text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table services enable row level security;

drop policy if exists "Allow public read access for services" on services;
create policy "Allow public read access for services"
  on services for select using (true);

drop policy if exists "Allow write access for services" on services;
create policy "Allow write access for services"
  on services for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 2) Testimonials / customer ratings
create table if not exists testimonials (
  id text primary key,
  name jsonb not null,
  rating int not null default 5 check (rating >= 1 and rating <= 5),
  comment jsonb not null,
  treatment jsonb not null default '{"ar":"","en":""}'::jsonb,
  date text not null default '',
  image text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table testimonials enable row level security;

drop policy if exists "Allow public read access for testimonials" on testimonials;
create policy "Allow public read access for testimonials"
  on testimonials for select using (true);

drop policy if exists "Allow write access for testimonials" on testimonials;
create policy "Allow write access for testimonials"
  on testimonials for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 3) Vision / About dual images (single-row settings)
create table if not exists vision_images (
  id text primary key default 'main',
  image_primary text not null default '',
  image_secondary text not null default '',
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table vision_images enable row level security;

drop policy if exists "Allow public read access for vision_images" on vision_images;
create policy "Allow public read access for vision_images"
  on vision_images for select using (true);

drop policy if exists "Allow write access for vision_images" on vision_images;
create policy "Allow write access for vision_images"
  on vision_images for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

insert into vision_images (id, image_primary, image_secondary) values
  ('main', '', '')
on conflict (id) do nothing;
