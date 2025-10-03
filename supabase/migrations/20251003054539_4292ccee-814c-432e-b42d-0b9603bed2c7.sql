-- Fix the notify_students_lesson_published function to handle authorization properly
CREATE OR REPLACE FUNCTION public.notify_students_lesson_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  student_record RECORD;
  auth_header text;
BEGIN
  -- Get authorization header safely
  BEGIN
    auth_header := current_setting('request.headers', true)::json->>'authorization';
  EXCEPTION WHEN OTHERS THEN
    auth_header := null;
  END;

  -- Notify all enrolled students
  FOR student_record IN 
    SELECT ce.student_id as user_id
    FROM course_enrollments ce
    WHERE ce.course_id = NEW.course_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (
      student_record.user_id,
      'lesson_published',
      'New Lesson Published',
      'A new lesson "' || NEW.title || '" has been published in your course.',
      '/courses/' || NEW.course_id::text || '/lesson/' || NEW.id::text
    );
    
    -- Trigger email notification only if we have auth header
    IF auth_header IS NOT NULL THEN
      PERFORM net.http_post(
        url := 'https://skuharpefattwtuxmvgj.supabase.co/functions/v1/send-notification-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || auth_header
        ),
        body := jsonb_build_object(
          'user_id', student_record.user_id,
          'notification_type', 'lesson_published',
          'title', 'New Lesson Published',
          'content', 'A new lesson "' || NEW.title || '" has been published in your course.',
          'link', '/courses/' || NEW.course_id::text || '/lesson/' || NEW.id::text
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;