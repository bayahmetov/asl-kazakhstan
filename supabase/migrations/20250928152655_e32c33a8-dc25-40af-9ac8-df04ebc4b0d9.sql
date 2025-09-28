-- Add duration column to lessons table for video duration tracking (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='duration') THEN
        ALTER TABLE public.lessons ADD COLUMN duration INTEGER;
    END IF;
END $$;

-- Update RLS policies for courses - only instructors can create/delete their own courses
DROP POLICY IF EXISTS "Instructors can create courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can update own courses" ON public.courses;

CREATE POLICY "Instructors can create courses" ON public.courses
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'instructor'
  )
);

CREATE POLICY "Instructors can update own courses" ON public.courses
FOR UPDATE TO authenticated
USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can delete own courses" ON public.courses
FOR DELETE TO authenticated
USING (instructor_id = auth.uid());

-- Update RLS policies for lessons - only course instructors can create/delete lessons
DROP POLICY IF EXISTS "Instructors can create lessons for own courses" ON public.lessons;
DROP POLICY IF EXISTS "Instructors can update lessons for own courses" ON public.lessons;

CREATE POLICY "Instructors can create lessons for own courses" ON public.lessons
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can update lessons for own courses" ON public.lessons
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can delete lessons for own courses" ON public.lessons
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()
  )
);