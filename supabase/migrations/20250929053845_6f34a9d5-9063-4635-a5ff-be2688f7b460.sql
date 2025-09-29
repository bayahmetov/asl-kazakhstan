-- Fix enrollment RLS policy to allow instructors to enroll students in their courses
-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Students can enroll themselves" ON public.course_enrollments;

-- Create new INSERT policy that allows both students to enroll themselves 
-- AND instructors to enroll students in their courses
CREATE POLICY "Allow course enrollment" 
ON public.course_enrollments 
FOR INSERT 
WITH CHECK (
  -- Students can enroll themselves
  auth.uid() = student_id 
  OR 
  -- Instructors can enroll students in their own courses
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_id 
    AND c.instructor_id = auth.uid()
  )
);