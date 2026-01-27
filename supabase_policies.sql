-- Enable RLS for 'videos' bucket
-- Run this in your Supabase SQL Editor

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow Public Read Access (so students can watch)
CREATE POLICY "Public Videos Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );

-- 3. Allow Authenticated Updates/Uploads (Instructors)
-- 3. Allow Public/Anon Updates (Since we use Custom Auth, not Supabase Auth)
CREATE POLICY "Public Videos Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'videos' );

-- 4. Allow Owners to Update/Delete their own videos
CREATE POLICY "Owner Video Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'videos' AND owner = auth.uid() );

CREATE POLICY "Owner Video Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'videos' AND owner = auth.uid() );
