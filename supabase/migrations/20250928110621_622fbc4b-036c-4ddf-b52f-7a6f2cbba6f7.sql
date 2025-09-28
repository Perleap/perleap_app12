-- Fix profiles policies to eliminate recursion completely
DROP POLICY IF EXISTS "profiles_own_access" ON profiles;
DROP POLICY IF EXISTS "profiles_teachers_view_students" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create simple, direct policies without any complex logic
CREATE POLICY "profiles_select_all_authenticated" ON profiles
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "profiles_insert_own_user" ON profiles
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own_user" ON profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);