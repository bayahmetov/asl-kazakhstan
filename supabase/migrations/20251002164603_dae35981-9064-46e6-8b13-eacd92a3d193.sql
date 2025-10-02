-- Add link field to notifications table
ALTER TABLE public.notifications ADD COLUMN link text;

-- Update trigger function for lesson published notifications
CREATE OR REPLACE FUNCTION public.notify_students_lesson_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert notifications for all enrolled students with deep link
  INSERT INTO public.notifications (user_id, type, title, content, link)
  SELECT 
    ce.student_id,
    'lesson_published',
    'New Lesson Published',
    'A new lesson "' || NEW.title || '" has been published in your course.',
    '/video-lesson/' || NEW.id::text
  FROM course_enrollments ce
  JOIN courses c ON c.id = ce.course_id
  WHERE c.id = NEW.course_id;
  
  RETURN NEW;
END;
$$;

-- Update trigger function for homework submitted notifications
CREATE OR REPLACE FUNCTION public.notify_instructor_homework_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  instructor_id UUID;
  course_title TEXT;
  lesson_title TEXT;
BEGIN
  -- Get instructor and course info
  SELECT c.instructor_id, c.title, l.title
  INTO instructor_id, course_title, lesson_title
  FROM lessons l
  JOIN courses c ON c.id = l.course_id
  WHERE l.id = NEW.lesson_id;
  
  -- Insert notification for instructor with deep link to submission
  INSERT INTO public.notifications (user_id, type, title, content, link)
  VALUES (
    instructor_id,
    'homework_submitted',
    'New Homework Submission',
    'A student has submitted homework for lesson "' || lesson_title || '" in course "' || course_title || '".',
    '/video-lesson/' || NEW.lesson_id::text
  );
  
  RETURN NEW;
END;
$$;

-- Update trigger function for homework feedback notifications
CREATE OR REPLACE FUNCTION public.notify_student_homework_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lesson_title TEXT;
BEGIN
  -- Only notify if feedback was added (instructor_comment or reviewed status changed)
  IF OLD.instructor_comment IS DISTINCT FROM NEW.instructor_comment OR 
     OLD.reviewed IS DISTINCT FROM NEW.reviewed THEN
    
    -- Get lesson title
    SELECT l.title INTO lesson_title
    FROM lessons l
    WHERE l.id = NEW.lesson_id;
    
    -- Insert notification for student with deep link to lesson
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (
      NEW.student_id,
      'homework_feedback',
      'Homework Feedback Received',
      'Your instructor has provided feedback on your submission for lesson "' || lesson_title || '".',
      '/video-lesson/' || NEW.lesson_id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update trigger function for course enrollment notifications
CREATE OR REPLACE FUNCTION public.notify_student_course_enrolled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_title TEXT;
BEGIN
  -- Get course title
  SELECT c.title INTO course_title
  FROM courses c
  WHERE c.id = NEW.course_id;
  
  -- Insert notification for student with deep link to course
  INSERT INTO public.notifications (user_id, type, title, content, link)
  VALUES (
    NEW.student_id,
    'course_enrolled',
    'Course Enrollment Confirmed',
    'You have been successfully enrolled in the course "' || course_title || '".',
    '/course-detail/' || NEW.course_id::text
  );
  
  RETURN NEW;
END;
$$;

-- Update trigger function for support ticket reply notifications
CREATE OR REPLACE FUNCTION public.notify_support_ticket_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      'system',
      'Support Ticket Reply',
      'You received a reply on your support ticket: "' || ticket_subject || '".',
      '/support'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update trigger function for message reply notifications
CREATE OR REPLACE FUNCTION public.notify_message_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if message was replied to and has a user_id
  IF NEW.replied AND NEW.user_id IS NOT NULL AND OLD.replied = false THEN
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (
      NEW.user_id,
      'system',
      'Message Reply Received',
      'An admin has replied to your contact message: "' || NEW.subject || '".',
      '/contact'
    );
  END IF;
  
  RETURN NEW;
END;
$$;