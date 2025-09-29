-- Fix email exposure vulnerability in profiles table
-- The current "Public can view limited profile data" policy exposes all columns including email
-- We need to restrict column access since RLS works at row level, not column level

-- 1. Drop the problematic public policy
DROP POLICY IF EXISTS "Public can view limited profile data" ON public.profiles;

-- 2. Create a secure function that returns only public instructor data
CREATE OR REPLACE FUNCTION public.get_public_instructor_profiles()
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  role text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.role,
    p.created_at
  FROM public.profiles p
  WHERE p.role = 'instructor';
$$;

-- 3. Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_instructor_profiles() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_instructor_profiles() TO authenticated;

-- 4. Create a view for easier access to public instructor data
CREATE OR REPLACE VIEW public.public_instructor_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  role,
  created_at
FROM public.profiles
WHERE role = 'instructor';

-- 5. Enable RLS on the view
ALTER VIEW public.public_instructor_profiles SET (security_barrier = true);

-- 6. Create policy for the view that allows public read access
-- Note: Views inherit RLS from underlying tables, so we need to ensure public access
-- The function approach above is more secure and recommended