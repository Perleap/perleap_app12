-- Create activity_assessments table to store Perleap assessments
CREATE TABLE public.activity_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_run_id UUID NOT NULL REFERENCES public.activity_runs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  chat_context JSONB NOT NULL,
  assessment_data JSONB NOT NULL,
  soft_table JSONB NOT NULL,
  cra_table JSONB NOT NULL,
  student_feedback TEXT,
  teacher_feedback TEXT,
  recommendations JSONB,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_assessments ENABLE ROW LEVEL SECURITY;

-- Create policies for assessments
CREATE POLICY "Students can view their own assessments" 
ON public.activity_assessments 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view assessments in their courses" 
ON public.activity_assessments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM courses 
  WHERE courses.id = activity_assessments.course_id 
  AND courses.teacher_id = auth.uid()
));

-- Create policy to allow inserting assessments (system generated)
CREATE POLICY "System can create assessments"
ON public.activity_assessments
FOR INSERT
WITH CHECK (true);

-- Add course_files table for file attachments
CREATE TABLE public.course_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for course files
ALTER TABLE public.course_files ENABLE ROW LEVEL SECURITY;

-- Create policies for course files
CREATE POLICY "Teachers can manage files in their courses"
ON public.course_files
FOR ALL
USING (EXISTS (
  SELECT 1 FROM courses 
  WHERE courses.id = course_files.course_id 
  AND courses.teacher_id = auth.uid()
));

CREATE POLICY "Students can view files in enrolled courses"
ON public.course_files
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM course_enrollments ce
  JOIN courses c ON c.id = ce.course_id
  WHERE c.id = course_files.course_id 
  AND ce.student_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX idx_activity_assessments_student_course ON public.activity_assessments(student_id, course_id);
CREATE INDEX idx_activity_assessments_completed_at ON public.activity_assessments(completed_at);
CREATE INDEX idx_course_files_course_id ON public.course_files(course_id);