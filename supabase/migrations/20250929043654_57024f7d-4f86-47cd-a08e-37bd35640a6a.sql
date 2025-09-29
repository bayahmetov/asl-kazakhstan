-- Fix critical security issue: Remove public access to paid lesson content and materials

-- 1. Remove public access to lesson content (titles, descriptions, storage keys)
DROP POLICY IF EXISTS "Public can view basic lesson info for browsing" ON public.lessons;

-- 2. Remove public access to lesson materials (file URLs, titles, etc.)
DROP POLICY IF EXISTS "Anyone can view lesson materials" ON public.lesson_materials;

-- 3. Create secure policies for lesson materials - only enrolled students and instructors
CREATE POLICY "Enrolled students can view lesson materials"
ON public.lesson_materials
FOR SELECT
USING (
  -- Students can view materials for courses they're enrolled in
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN courses c ON l.course_id = c.id
    JOIN course_enrollments ce ON ce.course_id = c.id
    WHERE l.id = lesson_materials.lesson_id 
    AND ce.student_id = auth.uid()
  )
  OR
  -- Instructors can view materials for their own courses
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE l.id = lesson_materials.lesson_id 
    AND c.instructor_id = auth.uid()
  )
);

-- 4. Ensure lessons are only accessible to enrolled students and instructors
-- (The existing "Enrolled students and instructors can view lessons" policy already handles this correctly)

-- 5. Add a secure policy for public course browsing that only shows course-level info
-- This allows potential students to browse courses without exposing lesson content
CREATE POLICY "Public can view course titles for browsing"
ON public.courses
FOR SELECT
USING (true);  -- Course-level info (title, description) can be public for marketing

-- Note: The existing course policy "Anyone can view courses" already handles this,
-- but we're being explicit about what should be public vs private