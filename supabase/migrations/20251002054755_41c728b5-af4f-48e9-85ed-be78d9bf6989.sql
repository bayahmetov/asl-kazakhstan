-- Video Protection: Prevent direct downloads of lesson videos
-- Update RLS policies for lesson-videos bucket to restrict access

-- Policy to allow enrolled students and instructors to view videos
CREATE POLICY "Enrolled students and instructors can view videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-videos' AND (
    -- Instructors can view videos from their own courses
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE l.storage_key = storage.objects.name
      AND c.instructor_id = auth.uid()
    )
    OR
    -- Enrolled students can view videos from their enrolled courses
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON c.id = l.course_id
      JOIN course_enrollments ce ON ce.course_id = c.id
      WHERE l.storage_key = storage.objects.name
      AND ce.student_id = auth.uid()
    )
  )
);

-- Policy for instructors to upload videos
CREATE POLICY "Instructors can upload videos to their courses"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-videos' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('instructor', 'admin')
  )
);

-- Policy for instructors to update videos
CREATE POLICY "Instructors can update their own course videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lesson-videos' AND
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN courses c ON c.id = l.course_id
    WHERE l.storage_key = storage.objects.name
    AND c.instructor_id = auth.uid()
  )
);

-- Policy for instructors to delete videos
CREATE POLICY "Instructors can delete their own course videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-videos' AND
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN courses c ON c.id = l.course_id
    WHERE l.storage_key = storage.objects.name
    AND c.instructor_id = auth.uid()
  )
);