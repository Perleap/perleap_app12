-- Fix infinite recursion in courses policies
DROP POLICY IF EXISTS "courses_students_select" ON courses;
DROP POLICY IF EXISTS "courses_teachers_all" ON courses;

-- Create new non-recursive policies for courses
CREATE POLICY "courses_select_enrolled_students" ON courses
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM course_enrollments 
    WHERE course_enrollments.course_id = courses.id 
    AND course_enrollments.student_id = auth.uid()
  )
);

CREATE POLICY "courses_teachers_manage" ON courses
FOR ALL 
USING (courses.teacher_id = auth.uid())
WITH CHECK (courses.teacher_id = auth.uid());

-- Fix profiles policies to ensure teachers can see student profiles
DROP POLICY IF EXISTS "Teachers can view enrolled student profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;

-- Create simpler, non-recursive profile policies
CREATE POLICY "profiles_own_access" ON profiles
FOR ALL
USING (profiles.user_id = auth.uid())
WITH CHECK (profiles.user_id = auth.uid());

CREATE POLICY "profiles_teachers_view_students" ON profiles
FOR SELECT
USING (
  profiles.role = 'student' 
  AND EXISTS (
    SELECT 1 FROM profiles teacher_profile
    WHERE teacher_profile.user_id = auth.uid() 
    AND teacher_profile.role = 'teacher'
  )
);