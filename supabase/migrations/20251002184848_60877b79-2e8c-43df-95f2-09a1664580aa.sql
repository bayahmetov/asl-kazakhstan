-- Remove unused security definer function that's triggering the linter warning
-- This function was created but never used in any policy
DROP FUNCTION IF EXISTS public.can_view_limited_profile(UUID, UUID);

-- The public_profiles view provides the column-level security we need
-- without requiring additional security definer functions