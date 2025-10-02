-- Make lesson-videos bucket private to prevent direct access
UPDATE storage.buckets 
SET public = false 
WHERE id = 'lesson-videos';

-- Add RLS policy for authenticated users to access videos through signed URLs
CREATE POLICY "Authenticated users can access lesson videos through signed URLs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'lesson-videos');