-- Run this in Supabase → SQL Editor if Storage uploads fail.
-- Creates public bucket policies for almaali-images (create the bucket in Storage UI first if needed).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'almaali-images',
  'almaali-images',
  true,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set public = true;

-- Public read
drop policy if exists "Public read almaali-images" on storage.objects;
create policy "Public read almaali-images"
on storage.objects for select
using (bucket_id = 'almaali-images');

-- Authenticated upload/update/delete
drop policy if exists "Auth write almaali-images" on storage.objects;
create policy "Auth write almaali-images"
on storage.objects for all
using (bucket_id = 'almaali-images' and auth.role() = 'authenticated')
with check (bucket_id = 'almaali-images' and auth.role() = 'authenticated');
