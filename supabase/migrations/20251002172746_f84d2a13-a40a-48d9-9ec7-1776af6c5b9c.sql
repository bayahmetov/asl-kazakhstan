-- Drop existing INSERT policy for course enrollments
DROP POLICY IF EXISTS "Allow course enrollment" ON course_enrollments;

-- Create new INSERT policy that includes assigned instructors
CREATE POLICY "Allow course enrollment" ON course_enrollments
FOR INSERT
WITH CHECK (
  (auth.uid() = student_id) OR 
  (EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_enrollments.course_id 
    AND c.instructor_id = auth.uid()
  )) OR
  (EXISTS (
    SELECT 1 FROM course_instructors ci 
    WHERE ci.course_id = course_enrollments.course_id 
    AND ci.instructor_id = auth.uid()
  ))
);

-- Also update DELETE policy to include assigned instructors
DROP POLICY IF EXISTS "Instructors can remove students from their courses" ON course_enrollments;

CREATE POLICY "Instructors can remove students from their courses" ON course_enrollments
FOR DELETE
USING (
  (EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_enrollments.course_id 
    AND c.instructor_id = auth.uid()
  )) OR
  (EXISTS (
    SELECT 1 FROM course_instructors ci 
    WHERE ci.course_id = course_enrollments.course_id 
    AND ci.instructor_id = auth.uid()
  ))
);