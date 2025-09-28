-- Make instructor_id nullable to allow courses without assigned instructors
ALTER TABLE public.courses ALTER COLUMN instructor_id DROP NOT NULL;

-- Insert 4 default courses
INSERT INTO public.courses (title, description) VALUES
('RSL Alphabet & Numbers', 'Master the fundamentals of Russian Sign Language with the alphabet and number system.'),
('Basic Conversations', 'Learn essential phrases and vocabulary for everyday conversations.'),
('Family & Relationships', 'Express family relationships, emotions, and personal connections.'),
('Professional & Business RSL', 'Advance your career with professional sign language skills.');