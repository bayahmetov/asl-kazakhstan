-- Update submissions policies to use is_course_instructor function for assigned instructors

-- Drop and recreate the SELECT policy for instructors
DROP POLICY IF EXISTS "Instructors can view submissions for their courses" ON submissions;

CREATE POLICY "Instructors can view submissions for their courses" ON submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE l.id = submissions.lesson_id
    AND public.is_course_instructor(auth.uid(), c.id)
  )
);

-- Drop and recreate the UPDATE policy for instructors
DROP POLICY IF EXISTS "Instructors can update submissions for their courses" ON submissions;

CREATE POLICY "Instructors can update submissions for their courses" ON submissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE l.id = submissions.lesson_id
    AND public.is_course_instructor(auth.uid(), c.id)
  )
);

-- Drop and recreate the DELETE policy for instructors
DROP POLICY IF EXISTS "Instructors can delete submissions for their courses" ON submissions;

CREATE POLICY "Instructors can delete submissions for their courses" ON submissions
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE l.id = submissions.lesson_id
    AND public.is_course_instructor(auth.uid(), c.id)
  )
);