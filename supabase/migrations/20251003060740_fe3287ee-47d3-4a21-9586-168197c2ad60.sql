-- Fix security issue: Remove public access to individual enrollment records
-- Drop the overly permissive policy that exposes student_id values
DROP POLICY IF EXISTS "Anyone can view enrollment counts" ON course_enrollments;

-- Create a trigger to automatically update enrolled_students count in courses table
CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE courses 
    SET enrolled_students = enrolled_students + 1
    WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE courses 
    SET enrolled_students = GREATEST(0, enrolled_students - 1)
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger on course_enrollments
DROP TRIGGER IF EXISTS trigger_update_enrollment_count ON course_enrollments;
CREATE TRIGGER trigger_update_enrollment_count
AFTER INSERT OR DELETE ON course_enrollments
FOR EACH ROW
EXECUTE FUNCTION update_course_enrollment_count();

-- Initialize enrolled_students count for existing courses
UPDATE courses 
SET enrolled_students = (
  SELECT COUNT(*) 
  FROM course_enrollments 
  WHERE course_enrollments.course_id = courses.id
);