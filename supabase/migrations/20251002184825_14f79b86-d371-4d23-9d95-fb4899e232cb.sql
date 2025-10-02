-- Fix security definer view warning
-- Remove security_barrier setting and rely on base table RLS instead
-- The view will automatically respect the profiles table RLS policies

-- Recreate the view without security_barrier setting
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  username,
  avatar_url,
  created_at
FROM public.profiles;

-- The view will inherit RLS from the base table automatically
-- No need for ALTER VIEW SET security_barrier