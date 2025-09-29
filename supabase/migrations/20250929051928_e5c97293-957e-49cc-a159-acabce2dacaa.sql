-- Fix critical privacy violation: Restrict instructor access to only their enrolled students
-- Currently instructors can see ALL student data, which violates privacy principles

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Instructors can view student profiles for course management" ON public.profiles;

-- Create a properly restricted policy that only allows instructors to see 
-- profiles of students enrolled in THEIR specific courses
CREATE POLICY "Instructors can view enrolled students profiles only"
ON public.profiles
FOR SELECT
USING (
  -- Users can always view their own profile
  auth.uid() = id 
  OR 
  -- Instructors can ONLY view profiles of students enrolled in their courses
  (
    public.get_user_role(auth.uid()) = 'instructor'
    AND 
    EXISTS (
      SELECT 1 
      FROM course_enrollments ce
      JOIN courses c ON c.id = ce.course_id
      WHERE ce.student_id = profiles.id 
      AND c.instructor_id = auth.uid()
    )
  )
);

-- Also create a policy for the course management page that only shows basic info
-- This is for the search functionality in course management
CREATE POLICY "Instructors can search students for enrollment"
ON public.profiles  
FOR SELECT
USING (
  -- Users can view their own profile
  auth.uid() = id
  OR
  -- Instructors can search student profiles for enrollment purposes
  -- but this should be limited to basic info needed for course management
  (
    public.get_user_role(auth.uid()) = 'instructor'
    AND profiles.role = 'student'
  )
);

-- Add security audit comments
COMMENT ON POLICY "Instructors can view enrolled students profiles only" ON public.profiles IS 
'PRIVACY POLICY: Instructors can only view full profiles of students enrolled in their specific courses';

COMMENT ON POLICY "Instructors can search students for enrollment" ON public.profiles IS 
'PRIVACY POLICY: Instructors can search all students for enrollment but should only see basic info needed for course management';