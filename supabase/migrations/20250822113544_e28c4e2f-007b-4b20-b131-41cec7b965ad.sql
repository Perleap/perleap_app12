-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  description TEXT,
  outline TEXT,
  cra_table JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Assessment', 'Training', 'Student-Chat', 'Collaboration', 'Innovation')),
  goal TEXT,
  difficulty TEXT DEFAULT 'adaptive' CHECK (difficulty IN ('adaptive', 'easy', 'hard')),
  config JSONB DEFAULT '{}'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_enrollments table
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  student_id UUID NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Create activity_runs table
CREATE TABLE public.activity_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL,
  student_id UUID NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('created', 'in_progress', 'completed', 'failed')),
  messages JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  response_time_ms INTEGER,
  relaxation_time_ms INTEGER
);

-- Create SRA snapshots table
CREATE TABLE public.sra_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  student_id UUID NOT NULL,
  dimension TEXT NOT NULL CHECK (dimension IN ('Vision', 'Values', 'Thinking', 'Connection', 'Action')),
  d_score INTEGER NOT NULL CHECK (d_score >= 1 AND d_score <= 100),
  m_score INTEGER NOT NULL CHECK (m_score >= 1 AND m_score <= 100),
  progression TEXT NOT NULL CHECK (progression IN ('Up', 'Down')),
  level_percent INTEGER NOT NULL CHECK (level_percent >= 0 AND level_percent <= 100),
  commentary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CRA snapshots table
CREATE TABLE public.cra_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  student_id UUID NOT NULL,
  area TEXT NOT NULL,
  ks_component TEXT NOT NULL,
  cl_percent INTEGER NOT NULL CHECK (cl_percent >= 0 AND cl_percent <= 100),
  ac_commentary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sra_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cra_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for courses
CREATE POLICY "Teachers can manage their own courses" 
ON public.courses 
FOR ALL 
USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view enrolled courses" 
ON public.courses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM course_enrollments 
  WHERE course_enrollments.course_id = courses.id 
  AND course_enrollments.student_id = auth.uid()
));

-- Create RLS policies for activities
CREATE POLICY "Teachers can manage activities in their courses" 
ON public.activities 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM courses 
  WHERE courses.id = activities.course_id 
  AND courses.teacher_id = auth.uid()
));

CREATE POLICY "Students can view activities in enrolled courses" 
ON public.activities 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM course_enrollments ce
  JOIN courses c ON c.id = ce.course_id
  WHERE ce.course_id = activities.course_id 
  AND ce.student_id = auth.uid()
));

-- Create RLS policies for course_enrollments
CREATE POLICY "Teachers can manage enrollments in their courses" 
ON public.course_enrollments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM courses 
  WHERE courses.id = course_enrollments.course_id 
  AND courses.teacher_id = auth.uid()
));

CREATE POLICY "Students can view their own enrollments" 
ON public.course_enrollments 
FOR SELECT 
USING (auth.uid() = student_id);

-- Create RLS policies for activity_runs
CREATE POLICY "Students can manage their own activity runs" 
ON public.activity_runs 
FOR ALL 
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view activity runs in their courses" 
ON public.activity_runs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM activities a
  JOIN courses c ON c.id = a.course_id
  WHERE a.id = activity_runs.activity_id 
  AND c.teacher_id = auth.uid()
));

-- Create RLS policies for SRA snapshots
CREATE POLICY "Students can view their own SRA snapshots" 
ON public.sra_snapshots 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view SRA snapshots in their courses" 
ON public.sra_snapshots 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM courses 
  WHERE courses.id = sra_snapshots.course_id 
  AND courses.teacher_id = auth.uid()
));

-- Create RLS policies for CRA snapshots
CREATE POLICY "Students can view their own CRA snapshots" 
ON public.cra_snapshots 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view CRA snapshots in their courses" 
ON public.cra_snapshots 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM courses 
  WHERE courses.id = cra_snapshots.course_id 
  AND courses.teacher_id = auth.uid()
));

-- Create triggers for updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX idx_activities_course_id ON public.activities(course_id);
CREATE INDEX idx_activity_runs_activity_id ON public.activity_runs(activity_id);
CREATE INDEX idx_activity_runs_student_id ON public.activity_runs(student_id);
CREATE INDEX idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_student_id ON public.course_enrollments(student_id);
CREATE INDEX idx_sra_snapshots_student_course ON public.sra_snapshots(student_id, course_id);
CREATE INDEX idx_cra_snapshots_student_course ON public.cra_snapshots(student_id, course_id);