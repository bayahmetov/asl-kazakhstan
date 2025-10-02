-- Fix public_profiles view accessibility
-- The issue: public_profiles view exists but cannot be accessed because
-- the underlying profiles table RLS only allows users to see their own profile.
-- This breaks features that need to display other users' public info (instructors, students).

-- Solution: Create a security definer function to safely expose public profile data

-- Drop the existing view temporarily
DROP VIEW IF EXISTS public.public_profiles;

-- Create a security definer function that returns public profile information
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    full_name,
    username,
    avatar_url,
    created_at
  FROM public.profiles;
$$;

-- Recreate the view using the security definer function
CREATE VIEW public.public_profiles AS
SELECT * FROM public.get_public_profiles();

-- Grant access to authenticated and anonymous users
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Add documentation
COMMENT ON VIEW public.public_profiles IS 
'Public-safe view of user profiles that excludes sensitive fields like email addresses.
Uses security definer function to bypass RLS on profiles table.
Safe for displaying instructor names, student lists, and user avatars.';

COMMENT ON FUNCTION public.get_public_profiles() IS
'Security definer function that returns non-sensitive profile information.
Allows authenticated and anonymous users to view public profile data without accessing emails or other sensitive information.';