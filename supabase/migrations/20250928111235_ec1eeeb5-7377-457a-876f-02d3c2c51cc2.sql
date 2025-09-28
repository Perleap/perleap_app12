-- First, get all existing policies and drop them
DROP POLICY IF EXISTS "courses_teacher_access" ON courses;
DROP POLICY IF EXISTS "courses_student_view" ON courses;
DROP POLICY IF EXISTS "courses_teachers_full_access" ON courses;
DROP POLICY IF EXISTS "courses_students_view_enrolled" ON courses;
DROP POLICY IF EXISTS "courses_select_enrolled_students" ON courses;
DROP POLICY IF EXISTS "courses_teachers_manage" ON courses;

-- Drop all course_enrollments policies
DROP POLICY IF EXISTS "enrollments_student_own" ON course_enrollments;
DROP POLICY IF EXISTS "enrollments_teacher_access" ON course_enrollments;
DROP POLICY IF EXISTS "ce_student_own" ON course_enrollments;
DROP POLICY IF EXISTS "ce_teacher_courses" ON course_enrollments;
DROP POLICY IF EXISTS "ce_student_insert" ON course_enrollments;

-- Create brand new courses policies with unique names
CREATE POLICY "courses_v2_teacher_manage" ON courses
FOR ALL 
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "courses_v2_student_enrolled" ON courses  
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT course_id FROM course_enrollments 
    WHERE student_id = auth.uid()
  )
);

-- Create brand new course_enrollments policies
CREATE POLICY "enrollments_v2_student_access" ON course_enrollments
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "enrollments_v2_teacher_manage" ON course_enrollments
FOR ALL 
TO authenticated
USING (course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid()))
WITH CHECK (course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid()));