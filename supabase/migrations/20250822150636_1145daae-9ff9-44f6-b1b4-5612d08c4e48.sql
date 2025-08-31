-- Drop the problematic policy
DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.profiles;

-- Create a security definer function to get user role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Create the corrected policy using the security definer function
CREATE POLICY "Teachers can view student profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Users can view their own profile
  (auth.uid() = user_id)
  OR
  -- Teachers can view student profiles
  (role = 'student' AND public.get_current_user_role() = 'teacher')
);