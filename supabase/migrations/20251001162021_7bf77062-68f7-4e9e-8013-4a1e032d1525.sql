-- 1. TECH SUPPORT SYSTEM
-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT CHECK (category IN ('technical', 'billing', 'course', 'account', 'other')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Policies for support_tickets
CREATE POLICY "Users can view their own tickets" 
ON public.support_tickets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" 
ON public.support_tickets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create support_replies table
CREATE TABLE public.support_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin_reply BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_replies ENABLE ROW LEVEL SECURITY;

-- Policies for support_replies
CREATE POLICY "Users can view replies for their tickets" 
ON public.support_replies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE id = ticket_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can reply to their own tickets" 
ON public.support_replies 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE id = ticket_id 
    AND user_id = auth.uid()
  ) AND auth.uid() = user_id
);

CREATE POLICY "Admins can view all replies" 
ON public.support_replies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can reply to all tickets" 
ON public.support_replies 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Trigger for support_tickets updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. MESSAGE REPLY SYSTEM
-- Add replied and replied_at fields to messages table
ALTER TABLE public.messages
ADD COLUMN replied BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN admin_reply TEXT,
ADD COLUMN replied_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN replied_by UUID REFERENCES auth.users(id);

-- Update messages policies to allow admins to update
CREATE POLICY "Admins can update messages" 
ON public.messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy to allow users to view their own messages
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = user_id);

-- 3. NOTIFICATION PREFERENCES
-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_lesson_published BOOLEAN NOT NULL DEFAULT true,
  email_homework_submitted BOOLEAN NOT NULL DEFAULT true,
  email_homework_feedback BOOLEAN NOT NULL DEFAULT true,
  email_course_enrolled BOOLEAN NOT NULL DEFAULT true,
  email_support_reply BOOLEAN NOT NULL DEFAULT true,
  email_message_reply BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for notification_preferences
CREATE POLICY "Users can view their own preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
ON public.notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Trigger for notification_preferences updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION public.create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create notification preferences on user signup
CREATE TRIGGER trigger_create_notification_preferences
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_notification_preferences();

-- 4. COURSE TAGS & SEARCH
-- Add tags column to courses
ALTER TABLE public.courses
ADD COLUMN tags TEXT[];

-- Create index for full-text search
CREATE INDEX idx_courses_title_search ON public.courses USING gin(to_tsvector('english', title));
CREATE INDEX idx_courses_description_search ON public.courses USING gin(to_tsvector('english', description));
CREATE INDEX idx_lessons_title_search ON public.lessons USING gin(to_tsvector('english', title));
CREATE INDEX idx_lessons_description_search ON public.lessons USING gin(to_tsvector('english', COALESCE(description, '')));
CREATE INDEX idx_courses_tags_search ON public.courses USING gin(tags);

-- Function to search courses and lessons
CREATE OR REPLACE FUNCTION public.search_content(search_query TEXT, search_level TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  description TEXT,
  level TEXT,
  instructor_id UUID,
  instructor_name TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    'course'::TEXT as type,
    c.title,
    c.description,
    c.level::TEXT,
    c.instructor_id,
    p.full_name as instructor_name,
    ts_rank(
      to_tsvector('english', c.title || ' ' || COALESCE(c.description, '') || ' ' || array_to_string(c.tags, ' ')),
      plainto_tsquery('english', search_query)
    ) as relevance
  FROM courses c
  LEFT JOIN profiles p ON p.id = c.instructor_id
  WHERE (
    to_tsvector('english', c.title || ' ' || COALESCE(c.description, '') || ' ' || array_to_string(c.tags, ' ')) 
    @@ plainto_tsquery('english', search_query)
  )
  AND (search_level IS NULL OR c.level::TEXT = search_level)
  
  UNION ALL
  
  SELECT 
    l.id,
    'lesson'::TEXT as type,
    l.title,
    l.description,
    NULL::TEXT as level,
    c.instructor_id,
    p.full_name as instructor_name,
    ts_rank(
      to_tsvector('english', l.title || ' ' || COALESCE(l.description, '')),
      plainto_tsquery('english', search_query)
    ) as relevance
  FROM lessons l
  JOIN courses c ON c.id = l.course_id
  LEFT JOIN profiles p ON p.id = c.instructor_id
  WHERE (
    to_tsvector('english', l.title || ' ' || COALESCE(l.description, '')) 
    @@ plainto_tsquery('english', search_query)
  )
  AND (search_level IS NULL OR c.level::TEXT = search_level)
  
  ORDER BY relevance DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 5. NOTIFICATION TRIGGERS FOR SUPPORT & MESSAGES
-- Notify user when admin replies to support ticket
CREATE OR REPLACE FUNCTION public.notify_support_ticket_reply()
RETURNS TRIGGER AS $$
DECLARE
  ticket_subject TEXT;
  ticket_user_id UUID;
BEGIN
  -- Only notify if it's an admin reply
  IF NEW.is_admin_reply THEN
    SELECT subject, user_id INTO ticket_subject, ticket_user_id
    FROM support_tickets
    WHERE id = NEW.ticket_id;
    
    INSERT INTO public.notifications (user_id, type, title, content)
    VALUES (
      ticket_user_id,
      'system',
      'Support Ticket Reply',
      'You received a reply on your support ticket: "' || ticket_subject || '".'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_support_reply
AFTER INSERT ON public.support_replies
FOR EACH ROW
EXECUTE FUNCTION public.notify_support_ticket_reply();

-- Notify user when admin replies to their message
CREATE OR REPLACE FUNCTION public.notify_message_reply()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if message was replied to and has a user_id
  IF NEW.replied AND NEW.user_id IS NOT NULL AND OLD.replied = false THEN
    INSERT INTO public.notifications (user_id, type, title, content)
    VALUES (
      NEW.user_id,
      'system',
      'Message Reply Received',
      'An admin has replied to your contact message: "' || NEW.subject || '".'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_message_reply
AFTER UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_message_reply();