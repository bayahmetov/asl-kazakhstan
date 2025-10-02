-- Update the SELECT policy for instructors to view all enrollments in their courses
DROP POLICY IF EXISTS "Instructors can view enrollments for their courses" ON course_enrollments;

CREATE POLICY "Instructors can view enrollments for their courses" ON course_enrollments
FOR SELECT
USING (
  (auth.uid() = student_id) OR 
  public.is_course_instructor(auth.uid(), course_id)
);