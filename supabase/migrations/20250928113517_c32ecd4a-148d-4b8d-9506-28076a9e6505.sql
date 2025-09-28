-- Fix the typo in the enrollment check function
CREATE OR REPLACE FUNCTION public.user_is_enrolled_in_course(course_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM course_enrollments 
    WHERE course_enrollments.course_id = $1 AND student_id = $2
  );
$$;