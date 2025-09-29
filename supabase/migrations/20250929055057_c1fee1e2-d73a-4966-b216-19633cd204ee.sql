-- Create messages table for contact form submissions
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  inquiry_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages table
CREATE POLICY "Anyone can insert messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all messages" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lesson_published', 'homework_submitted', 'homework_feedback', 'system', 'course_enrolled')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications table
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for updating updated_at on notifications
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notification for lesson published
CREATE OR REPLACE FUNCTION public.notify_students_lesson_published()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notifications for all enrolled students
  INSERT INTO public.notifications (user_id, type, title, content)
  SELECT 
    ce.student_id,
    'lesson_published',
    'New Lesson Published',
    'A new lesson "' || NEW.title || '" has been published in your course.'
  FROM course_enrollments ce
  JOIN courses c ON c.id = ce.course_id
  WHERE c.id = NEW.course_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for lesson published notifications
CREATE TRIGGER trigger_notify_lesson_published
AFTER INSERT ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.notify_students_lesson_published();

-- Function to notify instructor of homework submission
CREATE OR REPLACE FUNCTION public.notify_instructor_homework_submitted()
RETURNS TRIGGER AS $$
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
  
  -- Insert notification for instructor
  INSERT INTO public.notifications (user_id, type, title, content)
  VALUES (
    instructor_id,
    'homework_submitted',
    'New Homework Submission',
    'A student has submitted homework for lesson "' || lesson_title || '" in course "' || course_title || '".'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for homework submission notifications
CREATE TRIGGER trigger_notify_homework_submitted
AFTER INSERT ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_instructor_homework_submitted();

-- Function to notify student of homework feedback
CREATE OR REPLACE FUNCTION public.notify_student_homework_feedback()
RETURNS TRIGGER AS $$
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
    
    -- Insert notification for student
    INSERT INTO public.notifications (user_id, type, title, content)
    VALUES (
      NEW.student_id,
      'homework_feedback',
      'Homework Feedback Received',
      'Your instructor has provided feedback on your submission for lesson "' || lesson_title || '".'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for homework feedback notifications
CREATE TRIGGER trigger_notify_homework_feedback
AFTER UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_student_homework_feedback();

-- Function to notify student of course enrollment
CREATE OR REPLACE FUNCTION public.notify_student_course_enrolled()
RETURNS TRIGGER AS $$
DECLARE
  course_title TEXT;
BEGIN
  -- Get course title
  SELECT c.title INTO course_title
  FROM courses c
  WHERE c.id = NEW.course_id;
  
  -- Insert notification for student
  INSERT INTO public.notifications (user_id, type, title, content)
  VALUES (
    NEW.student_id,
    'course_enrolled',
    'Course Enrollment Confirmed',
    'You have been successfully enrolled in the course "' || course_title || '".'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for course enrollment notifications
CREATE TRIGGER trigger_notify_course_enrolled
AFTER INSERT ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.notify_student_course_enrolled();