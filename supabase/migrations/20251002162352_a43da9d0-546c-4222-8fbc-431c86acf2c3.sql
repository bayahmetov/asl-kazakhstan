-- Create support_topics table for FAQ
CREATE TABLE public.support_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on support_topics
ALTER TABLE public.support_topics ENABLE ROW LEVEL SECURITY;

-- Anyone can view topics
CREATE POLICY "Anyone can view support topics"
ON public.support_topics
FOR SELECT
USING (true);

-- Only admins can manage topics
CREATE POLICY "Admins can insert support topics"
ON public.support_topics
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update support topics"
ON public.support_topics
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete support topics"
ON public.support_topics
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add file_url column to support_replies for attachments
ALTER TABLE public.support_replies
ADD COLUMN file_url TEXT,
ADD COLUMN file_name TEXT,
ADD COLUMN file_type TEXT,
ADD COLUMN file_size INTEGER;

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', false);

-- RLS policies for support-attachments bucket
CREATE POLICY "Users can upload attachments to their tickets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'support-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view attachments for their tickets"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'support-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'support-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

-- Add delete policy for support_tickets
CREATE POLICY "Users can delete their own tickets"
ON public.support_tickets
FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add delete policy for support_replies
CREATE POLICY "Users can delete replies from their tickets"
ON public.support_replies
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = support_replies.ticket_id
    AND (
      support_tickets.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  )
);

-- Insert some sample FAQ topics
INSERT INTO public.support_topics (title, content, category, display_order) VALUES
('How do I enroll in a course?', 'To enroll in a course, navigate to the Courses page, select the course you''re interested in, and click the "Enroll" button. Your instructor will approve your enrollment.', 'Getting Started', 1),
('How do I submit homework?', 'Open any lesson page and scroll to the homework section. You can upload files or enter text answers, then click "Submit Homework".', 'Homework', 2),
('How do I track my progress?', 'Your progress is automatically tracked as you complete lessons. Visit your Dashboard to see your overall progress and enrolled courses.', 'Progress', 3),
('Can I access lessons on mobile devices?', 'Yes! Our platform is fully responsive and works on desktop, tablet, and mobile devices.', 'Technical', 4),
('How do I contact my instructor?', 'You can use the Support page to create a ticket, or check if your course has direct messaging enabled.', 'Communication', 5);

-- Add trigger for updated_at on support_topics
CREATE TRIGGER update_support_topics_updated_at
BEFORE UPDATE ON public.support_topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();