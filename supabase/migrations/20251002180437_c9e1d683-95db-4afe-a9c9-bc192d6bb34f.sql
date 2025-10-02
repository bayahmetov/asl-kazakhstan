-- Allow instructors to view other instructors' profiles for courses they collaborate on
CREATE POLICY "Instructors can view collaborating instructors profiles" ON profiles
FOR SELECT
USING (
  -- Users can view profiles of instructors they collaborate with
  EXISTS (
    SELECT 1 
    FROM courses c
    WHERE c.instructor_id = profiles.id
    AND public.is_course_instructor(auth.uid(), c.id)
  )
);