-- Allow teachers to view student profiles for course assignment
CREATE POLICY "Teachers can view student profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Teachers can view student profiles
  (role = 'student' AND EXISTS (
    SELECT 1 FROM profiles teacher_profile 
    WHERE teacher_profile.user_id = auth.uid() 
    AND teacher_profile.role = 'teacher'
  ))
  OR
  -- Users can still view their own profile
  (auth.uid() = user_id)
);