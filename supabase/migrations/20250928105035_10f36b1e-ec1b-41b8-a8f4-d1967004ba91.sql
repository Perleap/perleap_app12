-- Completely rebuild policies to avoid any circular references

-- First, temporarily disable RLS to break any cycles
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers view enrolled students" ON public.profiles;
DROP POLICY IF EXISTS "Teachers manage own courses" ON public.courses;
DROP POLICY IF EXISTS "Students view enrolled courses" ON public.courses;
DROP POLICY IF EXISTS "Students view own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students can enroll themselves" ON public.course_enrollments;
DROP POLICY IF EXISTS "Teachers manage course enrollments" ON public.course_enrollments;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- Profiles: Allow users to manage their own profiles only
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Courses: Teachers manage their own, students see enrolled courses
CREATE POLICY "courses_teachers_all" ON public.courses FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "courses_students_select" ON public.courses FOR SELECT USING (
  EXISTS (SELECT 1 FROM course_enrollments WHERE course_id = courses.id AND student_id = auth.uid())
);

-- Course enrollments: Simple ownership-based access
CREATE POLICY "enrollments_students_select" ON public.course_enrollments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "enrollments_teachers_all" ON public.course_enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_enrollments.course_id AND teacher_id = auth.uid())
);