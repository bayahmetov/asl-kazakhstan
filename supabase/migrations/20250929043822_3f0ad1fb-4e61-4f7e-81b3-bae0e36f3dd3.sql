-- Fix the security definer view warning by removing it and using a simpler approach
-- Drop the problematic security definer view
DROP VIEW IF EXISTS public.public_instructor_profiles;

-- The security definer function is fine and more secure
-- Keep the function as it's the recommended approach for column-level security

-- Add a comment to document the security approach
COMMENT ON FUNCTION public.get_public_instructor_profiles() IS 
'Returns only public fields (no email) for instructor profiles. Use this function instead of direct table access for public data.';

-- Note: Applications should use the get_public_instructor_profiles() function
-- to access instructor data publicly, which excludes sensitive fields like email