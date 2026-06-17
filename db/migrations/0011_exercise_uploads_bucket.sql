-- 0011_exercise_uploads_bucket.sql
-- Append-only: never edit this file after merging to main.
-- Run via Supabase dashboard SQL editor or CLI with service role.

-- Create the storage bucket for exercise md uploads.
-- The application upload endpoint validates file type + size before writing.
insert into storage.buckets (id, name, public)
values ('exercise-uploads', 'exercise-uploads', false)
on conflict (id) do nothing;

-- Learners may read/write only their own folder: exercise-uploads/<user_id>/*
create policy "eu_select_own" on storage.objects
  for select
  using (
    bucket_id = 'exercise-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "eu_insert_own" on storage.objects
  for insert
  with check (
    bucket_id = 'exercise-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "eu_update_own" on storage.objects
  for update
  using (
    bucket_id = 'exercise-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
