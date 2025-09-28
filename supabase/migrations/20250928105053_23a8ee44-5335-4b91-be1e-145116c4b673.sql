-- Fix infinite recursion by recreating all course_enrollments policies with new names

-- Drop all existing policies on course_enrollments
DROP POLICY IF EXISTS "Students view own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Teachers can manage enrollments in their courses" ON public.course_enrollments;
DROP POLICY IF EXISTS "Teachers manage course enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students can enroll themselves" ON public.course_enrollments;

-- Create completely new safe policies with different names
CREATE POLICY "enrollment_student_select" 
ON public.course_enrollments 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "enrollment_student_insert" 
ON public.course_enrollments 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "enrollment_teacher_manage" 
ON public.course_enrollments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM courses 
    WHERE courses.id = course_enrollments.course_id 
    AND courses.teacher_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM courses 
    WHERE courses.id = course_enrollments.course_id 
    AND courses.teacher_id = auth.uid()
  )
);