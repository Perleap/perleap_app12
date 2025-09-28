-- Fix security issue: Add search_path to the function
CREATE OR REPLACE FUNCTION public.populate_course_teacher_name()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;