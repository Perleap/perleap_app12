-- Drop all existing policies to eliminate circular dependencies
DROP POLICY IF EXISTS "courses_teacher_manage" ON courses;
DROP POLICY IF EXISTS "courses_student_view" ON courses;
DROP POLICY IF EXISTS "enrollments_student_manage" ON course_enrollments;
DROP POLICY IF EXISTS "enrollments_teacher_manage" ON course_enrollments;

-- Create security definer functions to avoid circular references
CREATE OR REPLACE FUNCTION public.user_is_course_teacher(course_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM courses 
    WHERE id = course_id AND teacher_id = user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_enrolled_in_course(course_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM course_enrollments 
    WHERE course_id = course_id AND student_id = user_id
  );
$$;

-- Create new non-recursive policies using security definer functions
CREATE POLICY "courses_teacher_access" ON courses
FOR ALL 
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "courses_student_enrolled_access" ON courses  
FOR SELECT
TO authenticated
USING (public.user_is_enrolled_in_course(id, auth.uid()));

-- Simple course_enrollments policies without cross-references
CREATE POLICY "enrollments_student_access" ON course_enrollments
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "enrollments_teacher_access" ON course_enrollments
FOR ALL 
TO authenticated
USING (public.user_is_course_teacher(course_id, auth.uid()))
WITH CHECK (public.user_is_course_teacher(course_id, auth.uid()));