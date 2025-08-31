-- Fix infinite recursion by updating the RLS policy for courses
-- The issue might be caused by circular references in the policy

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Students can view courses they are enrolled in" ON courses;

-- Recreate the policy with a more specific approach
CREATE POLICY "Students can view enrolled courses" 
ON courses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM course_enrollments ce 
    WHERE ce.course_id = courses.id 
    AND ce.student_id = auth.uid()
  )
);