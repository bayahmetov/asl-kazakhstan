-- Add database indexes to improve instructor dashboard performance
-- These indexes will speed up common queries used in the instructor dashboard

-- Index for submissions by lesson (used when fetching submissions for specific lessons)
CREATE INDEX IF NOT EXISTS idx_submissions_lesson_id ON public.submissions (lesson_id);

-- Index for submissions by student (used when joining with profiles)
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions (student_id);

-- Index for lessons by course (used when fetching lessons for specific courses)
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons (course_id);

-- Index for course enrollments by course and student (used for enrollment lookups)
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_student ON public.course_enrollments (course_id, student_id);

-- Index for courses by instructor (used when fetching instructor's courses)
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses (instructor_id);

-- Index for lesson progress by student and lesson (used for progress tracking)
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_lesson ON public.lesson_progress (student_id, lesson_id);

-- Index for lesson materials by lesson (used when fetching lesson materials)
CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson_id ON public.lesson_materials (lesson_id);

-- Composite index for submissions with review status and creation date (for sorting)
CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_created ON public.submissions (reviewed, created_at DESC);

-- Index for submissions by instructor (via lessons -> courses path)
-- This will help with the instructor dashboard queries
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions (created_at DESC);