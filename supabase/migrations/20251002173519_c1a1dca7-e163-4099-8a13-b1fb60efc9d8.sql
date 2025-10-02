-- Update the profiles policy to allow assigned instructors to view enrolled students
DROP POLICY IF EXISTS "Instructors can view enrolled students basic info" ON profiles;

CREATE POLICY "Instructors can view enrolled students basic info" ON profiles
FOR SELECT
USING (
  (auth.uid() = id) OR 
  (EXISTS (
    SELECT 1 
    FROM course_enrollments ce
    WHERE ce.student_id = profiles.id 
    AND public.is_course_instructor(auth.uid(), ce.course_id)
  ))
);