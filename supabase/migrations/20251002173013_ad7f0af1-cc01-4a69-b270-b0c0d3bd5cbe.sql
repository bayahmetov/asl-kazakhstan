-- Create security definer function to check if user is instructor for a course
CREATE OR REPLACE FUNCTION public.is_course_instructor(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM courses 
    WHERE id = _course_id 
    AND instructor_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM course_instructors 
    WHERE course_id = _course_id 
    AND instructor_id = _user_id
  )
$$;

-- Drop and recreate the INSERT policy using the function
DROP POLICY IF EXISTS "Allow course enrollment" ON course_enrollments;

CREATE POLICY "Allow course enrollment" ON course_enrollments
FOR INSERT
WITH CHECK (
  (auth.uid() = student_id) OR 
  public.is_course_instructor(auth.uid(), course_id)
);

-- Update DELETE policy to use the same function
DROP POLICY IF EXISTS "Instructors can remove students from their courses" ON course_enrollments;

CREATE POLICY "Instructors can remove students from their courses" ON course_enrollments
FOR DELETE
USING (
  public.is_course_instructor(auth.uid(), course_id)
);