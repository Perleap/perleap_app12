-- Completely rebuild courses policies without any recursion
DROP POLICY IF EXISTS "courses_teachers_full_access" ON courses;
DROP POLICY IF EXISTS "courses_students_view_enrolled" ON courses;

-- Create completely new, simple policies for courses
CREATE POLICY "courses_teacher_access" ON courses
FOR ALL 
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- For students, we'll create a simple policy that doesn't use EXISTS
CREATE POLICY "courses_student_view" ON courses  
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT course_id FROM course_enrollments 
    WHERE student_id = auth.uid()
  )
);

-- Also ensure course_enrollments policies are completely clean
DROP POLICY IF EXISTS "ce_student_own" ON course_enrollments;
DROP POLICY IF EXISTS "ce_teacher_courses" ON course_enrollments;
DROP POLICY IF EXISTS "ce_student_insert" ON course_enrollments;

-- Create new simple course_enrollments policies
CREATE POLICY "enrollments_student_own" ON course_enrollments
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "enrollments_teacher_access" ON course_enrollments
FOR ALL 
TO authenticated
USING (course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid()))
WITH CHECK (course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid()));