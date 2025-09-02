-- Security fixes migration

-- 1. Create a secure function to update profiles without allowing role changes
CREATE OR REPLACE FUNCTION public.secure_update_profile(
  p_full_name TEXT DEFAULT NULL,
  p_profile_picture_url TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET 
    full_name = COALESCE(p_full_name, full_name),
    profile_picture_url = COALESCE(p_profile_picture_url, profile_picture_url),
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;

-- 2. Drop existing problematic policies and create secure ones
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "System can create assessments" ON activity_assessments;

-- 3. Create secure profile update policy (no role changes allowed)
CREATE POLICY "Users can update their own profile (secure)" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND role = (SELECT role FROM profiles WHERE user_id = auth.uid())
);

-- 4. Fix activity_assessments INSERT policy to be strict
CREATE POLICY "Students can create their own assessments only" 
ON activity_assessments 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- 5. Tighten course creation to require teacher role
DROP POLICY IF EXISTS "Teachers can manage their own courses" ON courses;

CREATE POLICY "Teachers can manage their own courses" 
ON courses 
FOR ALL 
USING (
  auth.uid() = teacher_id 
  AND EXISTS(
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
)
WITH CHECK (
  auth.uid() = teacher_id 
  AND EXISTS(
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
);

-- 6. Update the handle_new_user function to only allow student role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'student'  -- Always default to student, regardless of metadata
  );
  RETURN new;
END;
$$;