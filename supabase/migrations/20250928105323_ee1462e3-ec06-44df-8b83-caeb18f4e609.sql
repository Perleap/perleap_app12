-- Drop ALL existing policies on course_enrollments
DROP POLICY IF EXISTS "enrollments_students_select" ON public.course_enrollments;
DROP POLICY IF EXISTS "enrollments_teachers_all" ON public.course_enrollments;
DROP POLICY IF EXISTS "enrollment_student_select" ON public.course_enrollments;
DROP POLICY IF EXISTS "enrollment_student_insert" ON public.course_enrollments;
DROP POLICY IF EXISTS "enrollment_teacher_manage" ON public.course_enrollments;

-- Create simple, non-recursive policies
CREATE POLICY "ce_student_own" 
ON public.course_enrollments 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "ce_teacher_courses" 
ON public.course_enrollments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM courses 
    WHERE courses.id = course_enrollments.course_id 
    AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "ce_student_insert" 
ON public.course_enrollments 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);