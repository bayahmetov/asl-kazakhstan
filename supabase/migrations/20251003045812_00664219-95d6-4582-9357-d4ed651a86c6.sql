-- Allow public access to view lessons for course browsing
-- This enables lesson count and duration stats to be visible to non-authenticated users

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Students, course instructors and assigned instructors can view" ON public.lessons;

-- Create new policy allowing anyone to view lessons (for browsing purposes)
CREATE POLICY "Anyone can view lessons"
ON public.lessons
FOR SELECT
TO public
USING (true);

-- Instructors can still create, update, delete their lessons (existing policies remain)

COMMENT ON POLICY "Anyone can view lessons" ON public.lessons IS
'Allows public access to view lesson information for course browsing. Actual video content access is controlled by storage bucket policies.';