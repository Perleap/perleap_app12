-- Update existing courses that don't have teacher_name populated
UPDATE courses 
SET teacher_name = COALESCE(
  (SELECT full_name FROM profiles WHERE user_id = courses.teacher_id),
  (SELECT email FROM profiles WHERE user_id = courses.teacher_id),
  'Unknown Teacher'
)
WHERE teacher_name IS NULL OR teacher_name = '';

-- Add a trigger to automatically populate teacher_name when courses are created/updated
CREATE OR REPLACE FUNCTION public.populate_course_teacher_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If teacher_name is not provided or empty, fetch it from profiles
  IF NEW.teacher_name IS NULL OR NEW.teacher_name = '' THEN
    SELECT COALESCE(full_name, email, 'Unknown Teacher')
    INTO NEW.teacher_name
    FROM profiles 
    WHERE user_id = NEW.teacher_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate teacher names
DROP TRIGGER IF EXISTS auto_populate_teacher_name ON courses;
CREATE TRIGGER auto_populate_teacher_name
  BEFORE INSERT OR UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION populate_course_teacher_name();