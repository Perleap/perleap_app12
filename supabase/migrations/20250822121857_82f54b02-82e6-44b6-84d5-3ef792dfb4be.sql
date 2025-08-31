-- Fix infinite recursion in RLS policies by simplifying course policies

-- Drop existing problematic policies for courses table
DROP POLICY IF EXISTS "Students can view enrolled courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can manage their own courses" ON public.courses;

-- Create simple, non-recursive policies for courses
CREATE POLICY "Teachers can manage their own courses" 
ON public.courses 
FOR ALL 
USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view courses they are enrolled in" 
ON public.courses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.course_enrollments 
    WHERE course_enrollments.course_id = courses.id 
    AND course_enrollments.student_id = auth.uid()
  )
);

-- Also fix any potential issues with course_enrollments policies
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Teachers can manage enrollments in their courses" ON public.course_enrollments;

CREATE POLICY "Students can view their own enrollments" 
ON public.course_enrollments 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can manage enrollments in their courses" 
ON public.course_enrollments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = course_enrollments.course_id 
    AND courses.teacher_id = auth.uid()
  )
);

-- Ensure activities policies are also clean
DROP POLICY IF EXISTS "Students can view activities in enrolled courses" ON public.activities;
DROP POLICY IF EXISTS "Teachers can manage activities in their courses" ON public.activities;

CREATE POLICY "Teachers can manage activities in their courses" 
ON public.activities 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = activities.course_id 
    AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view activities in enrolled courses" 
ON public.activities 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.course_enrollments ce
    JOIN public.courses c ON c.id = ce.course_id
    WHERE ce.course_id = activities.course_id 
    AND ce.student_id = auth.uid()
  )
);