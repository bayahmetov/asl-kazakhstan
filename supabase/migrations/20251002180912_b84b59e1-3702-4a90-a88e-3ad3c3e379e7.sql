-- Create the homework submission notification trigger
CREATE TRIGGER on_homework_submitted
  AFTER INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_instructor_homework_submitted();