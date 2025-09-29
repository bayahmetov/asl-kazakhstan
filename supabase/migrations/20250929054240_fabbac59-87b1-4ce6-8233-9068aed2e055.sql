-- Add DELETE policy to allow instructors to remove students from their courses
CREATE POLICY "Instructors can remove students from their courses" 
ON public.course_enrollments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_id 
    AND c.instructor_id = auth.uid()
  )
);