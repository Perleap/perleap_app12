-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "courses_v2_teacher_manage" ON courses;
DROP POLICY IF EXISTS "courses_v2_student_enrolled" ON courses;
DROP POLICY IF EXISTS "enrollments_v2_student_access" ON course_enrollments;
DROP POLICY IF EXISTS "enrollments_v2_teacher_manage" ON course_enrollments;

-- Simple non-recursive policies for courses table
CREATE POLICY "courses_teacher_manage" ON courses
FOR ALL 
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Simple policy for students to view enrolled courses (no subquery to avoid recursion)
CREATE POLICY "courses_student_view" ON courses  
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM course_enrollments 
    WHERE course_id = courses.id AND student_id = auth.uid()
  )
);

-- Simple non-recursive policies for course_enrollments table
CREATE POLICY "enrollments_student_manage" ON course_enrollments
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Teacher can manage enrollments for their courses (direct teacher_id check)
CREATE POLICY "enrollments_teacher_manage" ON course_enrollments
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE id = course_enrollments.course_id AND teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE id = course_enrollments.course_id AND teacher_id = auth.uid()
  )
);