-- Fix the policy conflict - remove the overly permissive policy
-- The previous approach still allowed access to all student data

-- Drop the problematic policy that allows access to all students
DROP POLICY IF EXISTS "Instructors can search students for enrollment" ON public.profiles;

-- Now we only have the restrictive policy that limits instructors to their enrolled students
-- For course management search, we'll create a separate function that returns only safe data

-- Create a secure function for course enrollment search that only returns safe, non-sensitive data
CREATE OR REPLACE FUNCTION public.search_students_for_enrollment()
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return basic info needed for course enrollment
  -- Exclude sensitive data like email addresses
  SELECT 
    p.id,
    p.full_name,
    p.username,
    p.role
  FROM public.profiles p
  WHERE p.role = 'student'
  AND public.get_user_role(auth.uid()) = 'instructor';
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_students_for_enrollment() TO authenticated;

-- Add security comment
COMMENT ON FUNCTION public.search_students_for_enrollment() IS 
'PRIVACY FUNCTION: Returns only basic non-sensitive student info for course enrollment. Excludes emails and other sensitive data.';