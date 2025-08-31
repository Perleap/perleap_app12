-- Fix infinite recursion by creating security definer functions
-- This will prevent the circular reference issue

-- Create function to check if user can view course via enrollment
CREATE OR REPLACE FUNCTION public.user_can_view_course(course_id uuid, user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM course_enrollments 
    WHERE course_enrollments.course_id = $1 
    AND course_enrollments.student_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop the existing policy and recreate with the function
DROP POLICY IF EXISTS "Students can view enrolled courses" ON courses;

-- Create new policy using the security definer function
CREATE POLICY "Students can view enrolled courses" 
ON courses 
FOR SELECT 
USING (public.user_can_view_course(courses.id, auth.uid()));