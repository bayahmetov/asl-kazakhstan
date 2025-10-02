-- Add RLS policy to allow admins to update user profiles
CREATE POLICY "Admins can update any user profile"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Also add a policy to allow admins to view all profiles for management
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);