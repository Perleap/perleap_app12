-- Fix security vulnerability: Remove overly permissive notification INSERT policy
-- The current policy "System can create notifications" with condition "true" allows anyone to create fake notifications

-- First, drop the insecure policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- The database functions (notify_student_enrollment, notify_activity_assignment) are SECURITY DEFINER
-- which means they run with elevated privileges and can bypass RLS policies anyway.
-- So we don't need any INSERT policy for notifications - they should only be created by system functions.

-- Optionally, we could add a very restrictive policy for edge functions if needed in the future:
-- This policy would only allow inserts from service role (not regular users)
-- CREATE POLICY "Service role can create notifications" ON public.notifications
-- FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- For now, we'll rely on SECURITY DEFINER functions for notification creation
-- This ensures only legitimate system processes can create notifications