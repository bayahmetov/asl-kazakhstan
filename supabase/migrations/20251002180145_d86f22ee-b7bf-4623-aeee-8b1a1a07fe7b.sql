-- Update the notification trigger to notify all instructors (owner + assigned)
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
  instructor_record RECORD;
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
    '/video-lesson/' || NEW.lesson_id::text
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
    '/video-lesson/' || NEW.lesson_id::text
  FROM course_instructors ci
  WHERE ci.course_id = course_id_var;
  
  RETURN NEW;
END;
$$;