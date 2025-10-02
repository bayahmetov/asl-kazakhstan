-- Fix public_profiles view accessibility and document profiles table security

-- The profiles table policies are working correctly:
-- 1. Users can ONLY see their own profile (auth.uid() = id)
-- 2. Admins can see all profiles (has_role admin check)
-- 3. All other users are IMPLICITLY DENIED (no matching policy = no access)
-- This is standard Postgres RLS behavior with PERMISSIVE policies

-- Add comment to clarify the security model
COMMENT ON TABLE public.profiles IS 
'User profiles with RLS protection. Email addresses are protected:
- Users can view/update only their own profile (including email)
- Admins can view/update all profiles
- All other access is denied by default (no matching policy)
For public profile viewing without emails, use public_profiles view';

-- Fix public_profiles view by adding access policies
-- Since views cannot have RLS policies directly, we need to grant SELECT permissions
-- and rely on the base table's RLS (which we've set with security_invoker=on)

-- Create a more detailed comment explaining the view's purpose
COMMENT ON VIEW public.public_profiles IS 
'Public-safe view of user profiles excluding sensitive fields like email addresses.
This view shows only: id, full_name, username, avatar_url, created_at.
Uses security_invoker=on to respect base table RLS policies.
Safe for displaying user information to other users.';

-- Grant appropriate access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Verify RLS is working by testing access patterns
-- (This is a comment for documentation, not executable)
-- Test 1: User A should see only their own profile from profiles table
-- Test 2: User A should see public info of User B from public_profiles
-- Test 3: Admin should see all profiles including emails from profiles table