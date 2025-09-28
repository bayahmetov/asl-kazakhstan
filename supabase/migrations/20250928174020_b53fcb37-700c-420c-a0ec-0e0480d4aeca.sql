-- Add feedback and reviewed_at fields to submissions table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'feedback') THEN
        ALTER TABLE public.submissions ADD COLUMN feedback TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'reviewed_at') THEN
        ALTER TABLE public.submissions ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create course_enrollments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  student_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Enable RLS on course_enrollments
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for course_enrollments to avoid conflicts
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students can enroll themselves" ON public.course_enrollments;
DROP POLICY IF EXISTS "Instructors can view enrollments for their courses" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.course_enrollments;

-- Create course_enrollments RLS policies
CREATE POLICY "Students can view their own enrollments" 
ON public.course_enrollments 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can enroll themselves" 
ON public.course_enrollments 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Instructors can view enrollments for their courses" 
ON public.course_enrollments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_enrollments.course_id 
    AND c.instructor_id = auth.uid()
  )
);

-- Drop and recreate submissions policies
DROP POLICY IF EXISTS "Students can delete their own submissions" ON public.submissions;

CREATE POLICY "Students can delete their own submissions" 
ON public.submissions 
FOR DELETE 
USING (auth.uid() = student_id);

CREATE POLICY "Instructors can delete submissions for their courses" 
ON public.submissions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM lessons l 
    JOIN courses c ON l.course_id = c.id 
    WHERE l.id = submissions.lesson_id 
    AND c.instructor_id = auth.uid()
  )
);