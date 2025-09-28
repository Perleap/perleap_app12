-- Fix infinite recursion - drop all existing policies first, then recreate them safely

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (secure)" ON public.profiles;

-- Drop all existing policies on courses table  
DROP POLICY IF EXISTS "Students can view enrolled courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can manage their own courses" ON public.courses;

-- Recreate safe policies for profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND role = ( SELECT p.role FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1));

-- Safe policy for teachers to view their students
CREATE POLICY "Teachers view enrolled students" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR (
    role = 'student' 
    AND EXISTS (
      SELECT 1 
      FROM course_enrollments ce 
      JOIN courses c ON c.id = ce.course_id 
      WHERE ce.student_id = profiles.user_id 
      AND c.teacher_id = auth.uid()
    )
  )
);

-- Recreate safe policies for courses
CREATE POLICY "Teachers manage own courses" 
ON public.courses 
FOR ALL
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Students view enrolled courses" 
ON public.courses 
FOR SELECT 
USING (
  auth.uid() = teacher_id 
  OR EXISTS (
    SELECT 1 
    FROM course_enrollments ce 
    WHERE ce.course_id = courses.id 
    AND ce.student_id = auth.uid()
  )
);