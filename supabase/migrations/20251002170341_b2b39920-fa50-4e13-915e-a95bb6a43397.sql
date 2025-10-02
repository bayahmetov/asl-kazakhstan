-- Drop the lesson_instructors table and create course_instructors instead
DROP TABLE IF EXISTS public.lesson_instructors CASCADE;

-- Create course_instructors junction table for assigning instructors to courses
CREATE TABLE IF NOT EXISTS public.course_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE(course_id, instructor_id)
);

-- Enable RLS
ALTER TABLE public.course_instructors ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all assignments
CREATE POLICY "Admins can manage course instructor assignments"
ON public.course_instructors
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
CREATE POLICY "Instructors can view their course assignments"
ON public.course_instructors
FOR SELECT
TO authenticated
USING (instructor_id = auth.uid());

-- Create index for better query performance
CREATE INDEX idx_course_instructors_course_id ON public.course_instructors(course_id);
CREATE INDEX idx_course_instructors_instructor_id ON public.course_instructors(instructor_id);

-- Update courses RLS policy to include assigned instructors
DROP POLICY IF EXISTS "Instructors can update own courses" ON public.courses;

CREATE POLICY "Instructors can update own or assigned courses"
ON public.courses
FOR UPDATE
TO authenticated
USING (
  instructor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.course_instructors
    WHERE course_instructors.course_id = courses.id
    AND course_instructors.instructor_id = auth.uid()
  )
);

-- Update lessons RLS policy to work with course assignments
DROP POLICY IF EXISTS "Enrolled students and assigned instructors can view lessons" ON public.lessons;

CREATE POLICY "Students, course instructors and assigned instructors can view lessons"
ON public.lessons
FOR SELECT
TO authenticated
USING (
  -- Course owner
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()
  )
  OR
  -- Assigned instructor to course
  EXISTS (
    SELECT 1 FROM course_instructors
    WHERE course_instructors.course_id = lessons.course_id
    AND course_instructors.instructor_id = auth.uid()
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

-- Update lessons policies for managing lessons
DROP POLICY IF EXISTS "Instructors can create lessons for own courses" ON public.lessons;
DROP POLICY IF EXISTS "Instructors can update lessons for own courses" ON public.lessons;
DROP POLICY IF EXISTS "Instructors can delete lessons for own courses" ON public.lessons;

CREATE POLICY "Instructors can create lessons for owned or assigned courses"
ON public.lessons
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM course_instructors
    WHERE course_instructors.course_id = lessons.course_id
    AND course_instructors.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can update lessons for owned or assigned courses"
ON public.lessons
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM course_instructors
    WHERE course_instructors.course_id = lessons.course_id
    AND course_instructors.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can delete lessons for owned or assigned courses"
ON public.lessons
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = lessons.course_id 
    AND courses.instructor_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM course_instructors
    WHERE course_instructors.course_id = lessons.course_id
    AND course_instructors.instructor_id = auth.uid()
  )
);