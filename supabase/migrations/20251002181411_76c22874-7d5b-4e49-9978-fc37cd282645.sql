-- Fix notification links to match actual routes

-- Update homework submission notification function
CREATE OR REPLACE FUNCTION public.notify_instructor_homework_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  course_id_var UUID;
  course_title TEXT;
  lesson_title TEXT;
BEGIN
  -- Get course_id, course title, and lesson title
  SELECT l.course_id, c.title, l.title
  INTO course_id_var, course_title, lesson_title
  FROM lessons l
  JOIN courses c ON c.id = l.course_id
  WHERE l.id = NEW.lesson_id;
  
  -- Notify the course owner
  INSERT INTO public.notifications (user_id, type, title, content, link)
  SELECT 
    c.instructor_id,
    'homework_submitted',
    'New Homework Submission',
    'A student has submitted homework for lesson "' || lesson_title || '" in course "' || course_title || '".',
    '/courses/' || course_id_var::text || '/lesson/' || NEW.lesson_id::text
  FROM courses c
  WHERE c.id = course_id_var
  AND c.instructor_id IS NOT NULL;
  
  -- Notify all assigned instructors
  INSERT INTO public.notifications (user_id, type, title, content, link)
  SELECT 
    ci.instructor_id,
    'homework_submitted',
    'New Homework Submission',
    'A student has submitted homework for lesson "' || lesson_title || '" in course "' || course_title || '".',
    '/courses/' || course_id_var::text || '/lesson/' || NEW.lesson_id::text
  FROM course_instructors ci
  WHERE ci.course_id = course_id_var;
  
  RETURN NEW;
END;
$$;

-- Update homework feedback notification function
CREATE OR REPLACE FUNCTION public.notify_student_homework_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  lesson_title TEXT;
  course_id_var UUID;
BEGIN
  -- Only notify if feedback was added
  IF OLD.instructor_comment IS DISTINCT FROM NEW.instructor_comment OR 
     OLD.reviewed IS DISTINCT FROM NEW.reviewed THEN
    
    -- Get lesson title and course_id
    SELECT l.title, l.course_id INTO lesson_title, course_id_var
    FROM lessons l
    WHERE l.id = NEW.lesson_id;
    
    -- Insert notification for student with correct route
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (
      NEW.student_id,
      'homework_feedback',
      'Homework Feedback Received',
      'Your instructor has provided feedback on your submission for lesson "' || lesson_title || '".',
      '/courses/' || course_id_var::text || '/lesson/' || NEW.lesson_id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update lesson published notification function
CREATE OR REPLACE FUNCTION public.notify_students_lesson_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert notifications for all enrolled students with correct route
  INSERT INTO public.notifications (user_id, type, title, content, link)
  SELECT 
    ce.student_id,
    'lesson_published',
    'New Lesson Published',
    'A new lesson "' || NEW.title || '" has been published in your course.',
    '/courses/' || NEW.course_id::text || '/lesson/' || NEW.id::text
  FROM course_enrollments ce
  WHERE ce.course_id = NEW.course_id;
  
  RETURN NEW;
END;
$$;

-- Update course enrollment notification to use correct route
CREATE OR REPLACE FUNCTION public.notify_student_course_enrolled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  course_title TEXT;
BEGIN
  -- Get course title
  SELECT c.title INTO course_title
  FROM courses c
  WHERE c.id = NEW.course_id;
  
  -- Insert notification for student with correct route
  INSERT INTO public.notifications (user_id, type, title, content, link)
  VALUES (
    NEW.student_id,
    'course_enrolled',
    'Course Enrollment Confirmed',
    'You have been successfully enrolled in the course "' || course_title || '".',
    '/courses/' || NEW.course_id::text
  );
  
  RETURN NEW;
END;
$$;