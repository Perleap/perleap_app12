-- Fix infinite recursion in course_enrollments policies
-- Drop existing policies
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Teachers can manage enrollments in their courses" ON public.course_enrollments;

-- Create safe policies for course_enrollments
CREATE POLICY "Students view own enrollments" 
ON public.course_enrollments 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can enroll themselves" 
ON public.course_enrollments 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers manage course enrollments" 
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