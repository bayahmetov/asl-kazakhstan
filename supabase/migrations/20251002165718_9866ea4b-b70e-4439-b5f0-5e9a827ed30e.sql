-- Create lesson_instructors junction table for assigning instructors to lessons
CREATE TABLE IF NOT EXISTS public.lesson_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE(lesson_id, instructor_id)
);

-- Enable RLS
ALTER TABLE public.lesson_instructors ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all assignments
CREATE POLICY "Admins can manage lesson instructor assignments"
ON public.lesson_instructors
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Instructors can view their own assignments
CREATE POLICY "Instructors can view their assignments"
ON public.lesson_instructors
FOR SELECT
TO authenticated
USING (instructor_id = auth.uid());

-- Create index for better query performance
CREATE INDEX idx_lesson_instructors_lesson_id ON public.lesson_instructors(lesson_id);
CREATE INDEX idx_lesson_instructors_instructor_id ON public.lesson_instructors(instructor_id);

-- Update lessons RLS policy to include assigned instructors
DROP POLICY IF EXISTS "Enrolled students and instructors can view lessons" ON public.lessons;

CREATE POLICY "Enrolled students and assigned instructors can view lessons"
ON public.lessons
FOR SELECT
TO authenticated
USING (
  -- Course instructor
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()
  )
  OR
  -- Assigned instructor
  EXISTS (
    SELECT 1 FROM lesson_instructors
    WHERE lesson_instructors.lesson_id = lessons.id
    AND lesson_instructors.instructor_id = auth.uid()
  )
  OR
  -- Enrolled student
  EXISTS (
    SELECT 1
    FROM course_enrollments ce
    JOIN courses c ON c.id = ce.course_id
    WHERE c.id = lessons.course_id 
    AND ce.student_id = auth.uid()
  )
);