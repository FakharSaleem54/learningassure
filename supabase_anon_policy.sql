-- FIX: Allow Anonymous Uploads
-- RATIONALE: The application uses custom Auth (Prisma), not Supabase Auth. 
-- Therefore, frontend uploads are treated as 'Anonymous' by Supabase.

-- 1. Drop the restrictive 'Authenticated' policies we added earlier
DROP POLICY IF EXISTS "Authenticated Videos Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Video Update" ON storage.objects;
DROP POLICY IF EXISTS "Owner Video Delete" ON storage.objects;

-- 2. Allow Anonymous Uploads (INSERT)
CREATE POLICY "Anon Video Upload"
ON storage.objects FOR INSERT
TO anon
WITH CHECK ( bucket_id = 'videos' );

-- 3. Allow Anonymous Updates (Required for upsert: true)
-- WARNING: This allows anyone with the API key to overwrite videos if they know the path.
-- For a production app, consider using Server-Side uploads instead.
CREATE POLICY "Anon Video Update"
ON storage.objects FOR UPDATE
TO anon
USING ( bucket_id = 'videos' );

-- 4. Allow Anonymous Deletes (Optional, for cleanup)
CREATE POLICY "Anon Video Delete"
ON storage.objects FOR DELETE
TO anon
USING ( bucket_id = 'videos' );
