-- Fix missing foreign key constraints causing slow loading in instructor dashboard
-- Only add constraints that don't already exist

-- Check and add foreign key constraints one by one with IF NOT EXISTS logic

-- Add foreign key constraint for course_enrollments.course_id -> courses.id (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'course_enrollments_course_id_fkey' 
        AND table_name = 'course_enrollments'
    ) THEN
        ALTER TABLE public.course_enrollments 
        ADD CONSTRAINT course_enrollments_course_id_fkey 
        FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for submissions.student_id -> profiles.id (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'submissions_student_id_fkey' 
        AND table_name = 'submissions'
    ) THEN
        ALTER TABLE public.submissions 
        ADD CONSTRAINT submissions_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for submissions.lesson_id -> lessons.id (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'submissions_lesson_id_fkey' 
        AND table_name = 'submissions'
    ) THEN
        ALTER TABLE public.submissions 
        ADD CONSTRAINT submissions_lesson_id_fkey 
        FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for lesson_progress.student_id -> profiles.id (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lesson_progress_student_id_fkey' 
        AND table_name = 'lesson_progress'
    ) THEN
        ALTER TABLE public.lesson_progress 
        ADD CONSTRAINT lesson_progress_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for lesson_progress.lesson_id -> lessons.id (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lesson_progress_lesson_id_fkey' 
        AND table_name = 'lesson_progress'
    ) THEN
        ALTER TABLE public.lesson_progress 
        ADD CONSTRAINT lesson_progress_lesson_id_fkey 
        FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for lessons.course_id -> courses.id (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lessons_course_id_fkey' 
        AND table_name = 'lessons'
    ) THEN
        ALTER TABLE public.lessons 
        ADD CONSTRAINT lessons_course_id_fkey 
        FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for courses.instructor_id -> profiles.id (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'courses_instructor_id_fkey' 
        AND table_name = 'courses'
    ) THEN
        ALTER TABLE public.courses 
        ADD CONSTRAINT courses_instructor_id_fkey 
        FOREIGN KEY (instructor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key constraint for lesson_materials.lesson_id -> lessons.id (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lesson_materials_lesson_id_fkey' 
        AND table_name = 'lesson_materials'
    ) THEN
        ALTER TABLE public.lesson_materials 
        ADD CONSTRAINT lesson_materials_lesson_id_fkey 
        FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for lesson_materials.uploaded_by -> profiles.id (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lesson_materials_uploaded_by_fkey' 
        AND table_name = 'lesson_materials'
    ) THEN
        ALTER TABLE public.lesson_materials 
        ADD CONSTRAINT lesson_materials_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;