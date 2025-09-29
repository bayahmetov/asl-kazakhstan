-- Fix infinite recursion in profiles RLS policies
-- The issue is that our policy queries the same table it's protecting

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Instructors can view all user profiles for course management" ON public.profiles;

-- Create a security definer function to check user roles safely
-- This breaks the recursion by using a separate function with elevated privileges
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.profiles 
  WHERE id = _user_id;
$$;

-- Create a safer policy using the security definer function
CREATE POLICY "Instructors can view student profiles for course management"
ON public.profiles
FOR SELECT
USING (
  -- Users can always view their own profile
  auth.uid() = id 
  OR 
  -- Instructors can view other profiles for course management
  public.get_user_role(auth.uid()) = 'instructor'
);

-- Add security audit comment
COMMENT ON FUNCTION public.get_user_role(uuid) IS 
'Security definer function to get user role without causing RLS recursion';

COMMENT ON POLICY "Instructors can view student profiles for course management" ON public.profiles IS 
'Security policy: Users can view own profiles, instructors can view all profiles for course management';