-- Fix RLS policies for messages table to restrict SELECT access
-- Drop the existing user view policy as it's too permissive
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;

-- Create a more restrictive policy that only allows users to view their own messages
-- AND ensures the user_id is not null (prevents issues with anonymous submissions)
CREATE POLICY "Users can view only their own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
);

-- Ensure admins can still view all messages (this policy should already exist)
-- Just being explicit here for clarity
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;

CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);