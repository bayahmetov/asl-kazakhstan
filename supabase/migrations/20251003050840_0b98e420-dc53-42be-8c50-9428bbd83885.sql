-- Allow anyone to view course enrollment counts for public course browsing
CREATE POLICY "Anyone can view enrollment counts"
ON public.course_enrollments
FOR SELECT
TO public
USING (true);