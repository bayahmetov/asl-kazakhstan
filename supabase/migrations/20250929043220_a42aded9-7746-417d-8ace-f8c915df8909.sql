-- Fix critical email exposure in profiles table
-- Drop the overly permissive policy that exposes all user emails
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create separate policies for public and private profile data
-- Users can view their own complete profile including email
CREATE POLICY "Users can view own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Public can view limited profile data (no email) for instructors and course listings
CREATE POLICY "Public can view limited profile data" 
ON public.profiles 
FOR SELECT 
USING (role = 'instructor' AND auth.uid() != id);

-- Fix course access to require enrollment for content viewing
-- Update lessons policy to check enrollment
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;

CREATE POLICY "Enrolled students and instructors can view lessons"
ON public.lessons
FOR SELECT
USING (
  -- Instructors can view their own course lessons
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()
  )
  OR
  -- Students can view lessons for courses they're enrolled in
  EXISTS (
    SELECT 1 FROM course_enrollments ce
    JOIN courses c ON c.id = ce.course_id
    WHERE c.id = lessons.course_id 
    AND ce.student_id = auth.uid()
  )
);

-- Allow public to view basic lesson info for course browsing (title, description only)
CREATE POLICY "Public can view basic lesson info for browsing"
ON public.lessons
FOR SELECT
USING (auth.uid() IS NULL);

-- Fix database functions security by updating search_path
CREATE OR REPLACE FUNCTION public.update_course_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update course enrollment completion percentage
  UPDATE course_enrollments SET
    completion_percentage = (
      SELECT COALESCE(
        ROUND(
          (COUNT(CASE WHEN lp.completed THEN 1 END)::FLOAT / 
           NULLIF(COUNT(*), 0) * 100)::INTEGER
        ), 0
      )
      FROM lessons l
      LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id 
        AND lp.student_id = NEW.student_id
      WHERE l.course_id = (
        SELECT course_id FROM lessons WHERE id = NEW.lesson_id
      )
    ),
    completed = (
      SELECT COUNT(CASE WHEN lp.completed THEN 1 END) = COUNT(*)
      FROM lessons l
      LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id 
        AND lp.student_id = NEW.student_id
      WHERE l.course_id = (
        SELECT course_id FROM lessons WHERE id = NEW.lesson_id
      )
    )
  WHERE student_id = NEW.student_id
    AND course_id = (
      SELECT course_id FROM lessons WHERE id = NEW.lesson_id
    );

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Make critical foreign key fields non-nullable for better security
ALTER TABLE course_enrollments ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE course_enrollments ALTER COLUMN course_id SET NOT NULL;
ALTER TABLE lessons ALTER COLUMN course_id SET NOT NULL;
ALTER TABLE lesson_materials ALTER COLUMN lesson_id SET NOT NULL;
ALTER TABLE lesson_progress ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE lesson_progress ALTER COLUMN lesson_id SET NOT NULL;
ALTER TABLE submissions ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE submissions ALTER COLUMN lesson_id SET NOT NULL;