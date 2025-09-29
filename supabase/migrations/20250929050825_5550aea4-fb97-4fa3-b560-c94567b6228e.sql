-- Add unique username field to profiles table
-- This allows each user to have a unique username that instructors can search by

-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT;

-- Create unique index for usernames (case-insensitive)
CREATE UNIQUE INDEX idx_profiles_username_unique 
ON public.profiles (LOWER(username));

-- Add constraint to ensure username follows proper format
-- Allow letters, numbers, underscores, and hyphens, 3-30 characters
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format_check 
CHECK (username IS NULL OR (username ~ '^[a-zA-Z0-9_-]{3,30}$'));

-- Add policy for instructors to view basic user info for course management
CREATE POLICY "Instructors can view all user profiles for course management"
ON public.profiles
FOR SELECT
USING (
  -- Allow instructors to see all user profiles (for course management)
  EXISTS (
    SELECT 1 
    FROM public.profiles instructor_profile
    WHERE instructor_profile.id = auth.uid() 
    AND instructor_profile.role = 'instructor'
  )
);

-- Add comment for security audit
COMMENT ON COLUMN public.profiles.username IS 'Unique username for each user, searchable by instructors for course management';
COMMENT ON POLICY "Instructors can view all user profiles for course management" ON public.profiles IS 
'Security policy: Instructors can view all user profiles for course enrollment management';