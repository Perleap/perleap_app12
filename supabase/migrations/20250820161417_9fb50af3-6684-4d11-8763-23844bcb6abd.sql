-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('teacher', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  description TEXT,
  cra_table JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Assessment', 'Training', 'Student-Chat', 'Collaboration', 'Innovation')),
  config JSONB DEFAULT '{}'::jsonb,
  goal TEXT,
  difficulty TEXT DEFAULT 'adaptive' CHECK (difficulty IN ('adaptive', 'easy', 'medium', 'hard')),
  steps JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create activity runs table
CREATE TABLE public.activity_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  response_time_ms INTEGER,
  relaxation_time_ms INTEGER
);

-- Create SRA snapshots table
CREATE TABLE public.sra_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  dimension TEXT NOT NULL CHECK (dimension IN ('Vision', 'Values', 'Thinking', 'Connection', 'Action')),
  d_score INTEGER NOT NULL CHECK (d_score >= 1 AND d_score <= 100),
  m_score INTEGER NOT NULL CHECK (m_score >= 1 AND m_score <= 100),
  progression TEXT NOT NULL CHECK (progression IN ('Up', 'Down')),
  level_percent INTEGER NOT NULL CHECK (level_percent >= 0 AND level_percent <= 100),
  commentary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create CRA snapshots table
CREATE TABLE public.cra_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  ks_component TEXT NOT NULL,
  cl_percent INTEGER NOT NULL CHECK (cl_percent >= 0 AND cl_percent <= 100),
  ac_commentary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create course enrollments table
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sra_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cra_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for courses
CREATE POLICY "Teachers can manage their own courses"
  ON public.courses FOR ALL
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view enrolled courses"
  ON public.courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments 
      WHERE course_id = courses.id AND student_id = auth.uid()
    )
  );

-- RLS Policies for activities
CREATE POLICY "Teachers can manage activities in their courses"
  ON public.activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = activities.course_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view activities in enrolled courses"
  ON public.activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      JOIN public.courses c ON c.id = ce.course_id
      WHERE ce.course_id = activities.course_id AND ce.student_id = auth.uid()
    )
  );

-- RLS Policies for activity runs
CREATE POLICY "Students can manage their own activity runs"
  ON public.activity_runs FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view activity runs in their courses"
  ON public.activity_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      JOIN public.courses c ON c.id = a.course_id
      WHERE a.id = activity_runs.activity_id AND c.teacher_id = auth.uid()
    )
  );

-- RLS Policies for SRA snapshots
CREATE POLICY "Students can view their own SRA snapshots"
  ON public.sra_snapshots FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view SRA snapshots in their courses"
  ON public.sra_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = sra_snapshots.course_id AND teacher_id = auth.uid()
    )
  );

-- RLS Policies for CRA snapshots
CREATE POLICY "Students can view their own CRA snapshots"
  ON public.cra_snapshots FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view CRA snapshots in their courses"
  ON public.cra_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = cra_snapshots.course_id AND teacher_id = auth.uid()
    )
  );

-- RLS Policies for course enrollments
CREATE POLICY "Teachers can manage enrollments in their courses"
  ON public.course_enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_enrollments.course_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own enrollments"
  ON public.course_enrollments FOR SELECT
  USING (auth.uid() = student_id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function for timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();