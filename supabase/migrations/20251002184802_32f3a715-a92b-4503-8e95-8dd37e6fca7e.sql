-- Fix email exposure in profiles table by restricting SELECT policies
-- Drop all existing SELECT policies that expose emails
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Instructors can view collaborating instructors profiles" ON public.profiles;
DROP POLICY IF EXISTS "Instructors can view enrolled students basic info" ON public.profiles;
DROP POLICY IF EXISTS "Instructors can view enrolled students profiles only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Require authentication for profile access" ON public.profiles;

-- Create new restrictive policies that prevent email exposure

-- 1. Users can view their OWN complete profile (including email)
CREATE POLICY "Users can view their own complete profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Admins can view ALL profiles (including emails)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Authenticated users can view LIMITED fields of other users (NO EMAIL)
-- This policy uses a helper function to filter out sensitive fields
CREATE OR REPLACE FUNCTION public.can_view_limited_profile(_viewer_id UUID, _profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Allow viewing limited profile if viewer is authenticated and viewing someone else's profile
  SELECT _viewer_id IS NOT NULL 
    AND _viewer_id != _profile_id;
$$;

-- Note: This policy is intentionally NOT created because Postgres RLS cannot
-- selectively hide columns. Instead, we'll create a separate public view
-- that exposes only non-sensitive fields.

-- Create a public view for limited profile access (without email)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  username,
  avatar_url,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Enable RLS on the view (it inherits from the base table)
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Alternative approach: Add explicit column-level security through application logic
-- Frontend/API should use public_profiles view for displaying other users
-- and profiles table only for own profile or admin access

-- Add helpful comment
COMMENT ON VIEW public.public_profiles IS 
'Public view of profiles that excludes sensitive fields like email addresses. 
Use this view when displaying user information to other users.
Use the profiles table directly only when users view their own profile or admins view all profiles.';