-- Create storage bucket for course files if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('course-files', 'course-files', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for course files bucket
CREATE POLICY "Teachers can upload course files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-files' AND
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.teacher_id = auth.uid() 
    AND (storage.foldername(name))[1] = 'course-files'
    AND (storage.foldername(name))[2] = courses.id::text
  )
);

CREATE POLICY "Teachers can view their course files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-files' AND
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.teacher_id = auth.uid() 
    AND (storage.foldername(name))[1] = 'course-files'
    AND (storage.foldername(name))[2] = courses.id::text
  )
);

CREATE POLICY "Students can view files from enrolled courses"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-files' AND
  EXISTS (
    SELECT 1 FROM course_enrollments ce
    JOIN courses c ON c.id = ce.course_id
    WHERE ce.student_id = auth.uid() 
    AND (storage.foldername(name))[1] = 'course-files'
    AND (storage.foldername(name))[2] = c.id::text
  )
);

CREATE POLICY "Teachers can delete their course files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-files' AND
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.teacher_id = auth.uid() 
    AND (storage.foldername(name))[1] = 'course-files'
    AND (storage.foldername(name))[2] = courses.id::text
  )
);