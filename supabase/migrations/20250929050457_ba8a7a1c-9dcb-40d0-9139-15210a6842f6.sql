-- Add policy for instructors to view basic student profile info
-- This is needed for instructor dashboard functionality while maintaining security
CREATE POLICY "Instructors can view enrolled students basic info"
ON public.profiles
FOR SELECT
USING (
  -- Allow instructors to see profiles of students enrolled in their courses
  EXISTS (
    SELECT 1 
    FROM course_enrollments ce
    JOIN courses c ON c.id = ce.course_id
    WHERE ce.student_id = profiles.id 
    AND c.instructor_id = auth.uid()
  )
);

-- Add security audit comment
COMMENT ON POLICY "Instructors can view enrolled students basic info" ON public.profiles IS 
'Security policy: Instructors can view basic profile info of students enrolled in their courses';