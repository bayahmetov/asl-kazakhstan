-- Fix security definer view by enabling security_invoker mode
-- This makes the view respect RLS policies of the querying user
-- instead of the view creator's permissions

ALTER VIEW public.public_profiles SET (security_invoker = on);

-- Now the view will execute with the permissions of the user querying it,
-- respecting RLS policies on the base profiles table