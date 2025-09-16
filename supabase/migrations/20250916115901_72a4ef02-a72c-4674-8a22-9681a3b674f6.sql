-- Fix critical security issue: Restrict teacher access to only their enrolled students
DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.profiles;

-- Create a more secure policy that only allows teachers to view profiles of students in their courses
CREATE POLICY "Teachers can view enrolled student profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR (
    role = 'student' 
    AND get_current_user_role() = 'teacher' 
    AND EXISTS (
      SELECT 1 
      FROM course_enrollments ce 
      JOIN courses c ON c.id = ce.course_id 
      WHERE ce.student_id = profiles.user_id 
      AND c.teacher_id = auth.uid()
    )
  )
);