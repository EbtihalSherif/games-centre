-- Shared Supabase setup for the whole games centre.
-- Run this FIRST, then each game's own packages/<game>/supabase/schema.sql.
-- Supabase > SQL Editor > New query > paste > Run. Safe to re-run.

-- Public image bucket used by any game that needs photos.
-- JPEG only, max 3 MB per file (the client downsizes before upload).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 3145728, array['image/jpeg'])
on conflict (id) do nothing;

do $$ begin
  create policy "anyone can view photos" on storage.objects for select using (bucket_id = 'photos');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "anyone can upload photos" on storage.objects for insert with check (bucket_id = 'photos');
exception when duplicate_object then null; end $$;
