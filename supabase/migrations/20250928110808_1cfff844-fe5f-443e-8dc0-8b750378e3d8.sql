-- Fix courses policies to eliminate all recursion
DROP POLICY IF EXISTS "courses_select_enrolled_students" ON courses;
DROP POLICY IF EXISTS "courses_teachers_manage" ON courses;

-- Create simple, direct policies for courses
CREATE POLICY "courses_teachers_full_access" ON courses
FOR ALL 
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "courses_students_view_enrolled" ON courses  
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM course_enrollments 
    WHERE course_enrollments.course_id = courses.id 
    AND course_enrollments.student_id = auth.uid()
  )
);