-- Update notification functions to trigger email sending

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
  instructor_record RECORD;
BEGIN
  -- Get course_id, course title, and lesson title
  SELECT l.course_id, c.title, l.title
  INTO course_id_var, course_title, lesson_title
  FROM lessons l
  JOIN courses c ON c.id = l.course_id
  WHERE l.id = NEW.lesson_id;
  
  -- Notify the course owner
  FOR instructor_record IN 
    SELECT c.instructor_id as user_id
    FROM courses c
    WHERE c.id = course_id_var AND c.instructor_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (
      instructor_record.user_id,
      'homework_submitted',
      'New Homework Submission',
      'A student has submitted homework for lesson "' || lesson_title || '" in course "' || course_title || '".',
      '/courses/' || course_id_var::text || '/lesson/' || NEW.lesson_id::text
    );
    
    -- Trigger email notification
    PERFORM net.http_post(
      url := 'https://skuharpefattwtuxmvgj.supabase.co/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
      ),
      body := jsonb_build_object(
        'user_id', instructor_record.user_id,
        'notification_type', 'homework_submitted',
        'title', 'New Homework Submission',
        'content', 'A student has submitted homework for lesson "' || lesson_title || '" in course "' || course_title || '".',
        'link', '/courses/' || course_id_var::text || '/lesson/' || NEW.lesson_id::text
      )
    );
  END LOOP;
  
  -- Notify all assigned instructors
  FOR instructor_record IN 
    SELECT ci.instructor_id as user_id
    FROM course_instructors ci
    WHERE ci.course_id = course_id_var
  LOOP
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (
      instructor_record.user_id,
      'homework_submitted',
      'New Homework Submission',
      'A student has submitted homework for lesson "' || lesson_title || '" in course "' || course_title || '".',
      '/courses/' || course_id_var::text || '/lesson/' || NEW.lesson_id::text
    );
    
    -- Trigger email notification
    PERFORM net.http_post(
      url := 'https://skuharpefattwtuxmvgj.supabase.co/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
      ),
      body := jsonb_build_object(
        'user_id', instructor_record.user_id,
        'notification_type', 'homework_submitted',
        'title', 'New Homework Submission',
        'content', 'A student has submitted homework for lesson "' || lesson_title || '" in course "' || course_title || '".',
        'link', '/courses/' || course_id_var::text || '/lesson/' || NEW.lesson_id::text
      )
    );
  END LOOP;
  
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
    
    -- Insert notification for student
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (
      NEW.student_id,
      'homework_feedback',
      'Homework Feedback Received',
      'Your instructor has provided feedback on your submission for lesson "' || lesson_title || '".',
      '/courses/' || course_id_var::text || '/lesson/' || NEW.lesson_id::text
    );
    
    -- Trigger email notification
    PERFORM net.http_post(
      url := 'https://skuharpefattwtuxmvgj.supabase.co/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
      ),
      body := jsonb_build_object(
        'user_id', NEW.student_id,
        'notification_type', 'homework_feedback',
        'title', 'Homework Feedback Received',
        'content', 'Your instructor has provided feedback on your submission for lesson "' || lesson_title || '".',
        'link', '/courses/' || course_id_var::text || '/lesson/' || NEW.lesson_id::text
      )
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
DECLARE
  student_record RECORD;
BEGIN
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
    
    -- Trigger email notification
    PERFORM net.http_post(
      url := 'https://skuharpefattwtuxmvgj.supabase.co/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
      ),
      body := jsonb_build_object(
        'user_id', student_record.user_id,
        'notification_type', 'lesson_published',
        'title', 'New Lesson Published',
        'content', 'A new lesson "' || NEW.title || '" has been published in your course.',
        'link', '/courses/' || NEW.course_id::text || '/lesson/' || NEW.id::text
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Update course enrollment notification function
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
  
  -- Insert notification for student
  INSERT INTO public.notifications (user_id, type, title, content, link)
  VALUES (
    NEW.student_id,
    'course_enrolled',
    'Course Enrollment Confirmed',
    'You have been successfully enrolled in the course "' || course_title || '".',
    '/courses/' || NEW.course_id::text
  );
  
  -- Trigger email notification
  PERFORM net.http_post(
    url := 'https://skuharpefattwtuxmvgj.supabase.co/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
    ),
    body := jsonb_build_object(
      'user_id', NEW.student_id,
      'notification_type', 'course_enrolled',
      'title', 'Course Enrollment Confirmed',
      'content', 'You have been successfully enrolled in the course "' || course_title || '".',
      'link', '/courses/' || NEW.course_id::text
    )
  );
  
  RETURN NEW;
END;
$$;

-- Update support ticket reply notification function
CREATE OR REPLACE FUNCTION public.notify_support_ticket_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  ticket_subject TEXT;
  ticket_user_id UUID;
BEGIN
  -- Only notify if it's an admin reply
  IF NEW.is_admin_reply THEN
    SELECT subject, user_id INTO ticket_subject, ticket_user_id
    FROM support_tickets
    WHERE id = NEW.ticket_id;
    
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (
      ticket_user_id,
      'support_reply',
      'Support Ticket Reply',
      'You received a reply on your support ticket: "' || ticket_subject || '".',
      '/support'
    );
    
    -- Trigger email notification
    PERFORM net.http_post(
      url := 'https://skuharpefattwtuxmvgj.supabase.co/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
      ),
      body := jsonb_build_object(
        'user_id', ticket_user_id,
        'notification_type', 'support_reply',
        'title', 'Support Ticket Reply',
        'content', 'You received a reply on your support ticket: "' || ticket_subject || '".',
        'link', '/support'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update message reply notification function
CREATE OR REPLACE FUNCTION public.notify_message_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only notify if message was replied to and has a user_id
  IF NEW.replied AND NEW.user_id IS NOT NULL AND OLD.replied = false THEN
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (
      NEW.user_id,
      'message_reply',
      'Message Reply Received',
      'An admin has replied to your contact message: "' || NEW.subject || '".',
      '/contact'
    );
    
    -- Trigger email notification
    PERFORM net.http_post(
      url := 'https://skuharpefattwtuxmvgj.supabase.co/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'notification_type', 'message_reply',
        'title', 'Message Reply Received',
        'content', 'An admin has replied to your contact message: "' || NEW.subject || '".',
        'link', '/contact'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;