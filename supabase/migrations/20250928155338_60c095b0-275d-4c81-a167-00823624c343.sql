-- Add course level enum and update courses table
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- Add level column to courses table
ALTER TABLE courses ADD COLUMN level course_level DEFAULT 'beginner';

-- Add enrolled_students column to track student count
ALTER TABLE courses ADD COLUMN enrolled_students INTEGER DEFAULT 0;

-- Create lesson_progress table for tracking student progress
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- Create submissions table for homework
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT,
  text_answer TEXT,
  reviewed BOOLEAN DEFAULT FALSE,
  instructor_comment TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- Create lesson_materials table for extra materials
CREATE TABLE lesson_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_enrollments table to track who is enrolled in what course
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  completion_percentage INTEGER DEFAULT 0,
  UNIQUE(course_id, student_id)
);

-- Enable RLS on new tables
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_progress
CREATE POLICY "Students can view their own progress" ON lesson_progress
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own progress" ON lesson_progress
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own progress" ON lesson_progress
FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Instructors can view progress for their courses" ON lesson_progress
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE l.id = lesson_progress.lesson_id 
    AND c.instructor_id = auth.uid()
  )
);

-- RLS Policies for submissions
CREATE POLICY "Students can view their own submissions" ON submissions
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own submissions" ON submissions
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own submissions" ON submissions
FOR UPDATE USING (auth.uid() = student_id AND NOT reviewed);

CREATE POLICY "Instructors can view submissions for their courses" ON submissions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE l.id = submissions.lesson_id 
    AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can update submissions for their courses" ON submissions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE l.id = submissions.lesson_id 
    AND c.instructor_id = auth.uid()
  )
);

-- RLS Policies for lesson_materials
CREATE POLICY "Anyone can view lesson materials" ON lesson_materials
FOR SELECT USING (true);

CREATE POLICY "Instructors can insert materials for their courses" ON lesson_materials
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE l.id = lesson_materials.lesson_id 
    AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can delete materials for their courses" ON lesson_materials
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN courses c ON l.course_id = c.id
    WHERE l.id = lesson_materials.lesson_id 
    AND c.instructor_id = auth.uid()
  )
);

-- RLS Policies for course_enrollments
CREATE POLICY "Students can view their own enrollments" ON course_enrollments
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can enroll themselves" ON course_enrollments
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Instructors can view enrollments for their courses" ON course_enrollments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_enrollments.course_id 
    AND c.instructor_id = auth.uid()
  )
);

-- Create storage buckets for homework and materials
INSERT INTO storage.buckets (id, name, public) VALUES ('homework-files', 'homework-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-materials', 'lesson-materials', true);

-- Storage policies for homework files
CREATE POLICY "Students can upload their homework" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'homework-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own homework files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'homework-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can view homework files for their courses" ON storage.objects
FOR SELECT USING (
  bucket_id = 'homework-files'
);

-- Storage policies for lesson materials
CREATE POLICY "Anyone can view lesson materials" ON storage.objects
FOR SELECT USING (bucket_id = 'lesson-materials');

CREATE POLICY "Instructors can upload lesson materials" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'lesson-materials'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'instructor'
  )
);

-- Function to update course completion percentage
CREATE OR REPLACE FUNCTION update_course_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update course enrollment completion percentage
  UPDATE course_enrollments SET
    completion_percentage = (
      SELECT COALESCE(
        ROUND(
          (COUNT(CASE WHEN lp.completed THEN 1 END)::FLOAT / 
           NULLIF(COUNT(*), 0) * 100)::INTEGER
        ), 0
      )
      FROM lessons l
      LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id 
        AND lp.student_id = NEW.student_id
      WHERE l.course_id = (
        SELECT course_id FROM lessons WHERE id = NEW.lesson_id
      )
    ),
    completed = (
      SELECT COUNT(CASE WHEN lp.completed THEN 1 END) = COUNT(*)
      FROM lessons l
      LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id 
        AND lp.student_id = NEW.student_id
      WHERE l.course_id = (
        SELECT course_id FROM lessons WHERE id = NEW.lesson_id
      )
    )
  WHERE student_id = NEW.student_id
    AND course_id = (
      SELECT course_id FROM lessons WHERE id = NEW.lesson_id
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update course completion when lesson progress changes
CREATE TRIGGER update_course_completion_trigger
  AFTER INSERT OR UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_course_completion();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();