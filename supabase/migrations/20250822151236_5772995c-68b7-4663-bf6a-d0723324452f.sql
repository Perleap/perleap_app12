
-- Add notification creation function
CREATE OR REPLACE FUNCTION public.notify_student_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_title TEXT;
BEGIN
  -- Get the course title
  SELECT title INTO course_title
  FROM courses
  WHERE id = NEW.course_id;
  
  -- Create notification for the student
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    NEW.student_id,
    'enrollment',
    'Course Enrollment',
    'You have been enrolled in the course: ' || COALESCE(course_title, 'Unknown Course')
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for course enrollment notifications
DROP TRIGGER IF EXISTS notify_student_on_enrollment ON public.course_enrollments;
CREATE TRIGGER notify_student_on_enrollment
  AFTER INSERT ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_student_enrollment();

-- Allow inserting notifications (needed for the trigger)
CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create activity assignment table for teachers to assign activities to students
CREATE TABLE IF NOT EXISTS public.activity_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'started', 'completed')),
  UNIQUE(activity_id, student_id)
);

-- Enable RLS on activity assignments
ALTER TABLE public.activity_assignments ENABLE ROW LEVEL SECURITY;

-- Students can view their assignments
CREATE POLICY "Students can view their assignments"
ON public.activity_assignments
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Teachers can manage assignments for their courses
CREATE POLICY "Teachers can manage assignments"
ON public.activity_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM activities a
    JOIN courses c ON c.id = a.course_id
    WHERE a.id = activity_assignments.activity_id
    AND c.teacher_id = auth.uid()
  )
);

-- Create notification function for activity assignments
CREATE OR REPLACE FUNCTION public.notify_activity_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_title TEXT;
  course_title TEXT;
BEGIN
  -- Get activity and course titles
  SELECT a.title, c.title INTO activity_title, course_title
  FROM activities a
  JOIN courses c ON c.id = a.course_id
  WHERE a.id = NEW.activity_id;
  
  -- Create notification for the student
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    NEW.student_id,
    'assignment',
    'New Activity Assignment',
    'You have been assigned the activity "' || COALESCE(activity_title, 'Unknown Activity') || 
    '" in course "' || COALESCE(course_title, 'Unknown Course') || '"'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for activity assignment notifications
CREATE TRIGGER notify_activity_assignment
  AFTER INSERT ON public.activity_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_activity_assignment();
