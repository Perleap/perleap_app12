-- Add teacher_name column to courses table
ALTER TABLE public.courses 
ADD COLUMN teacher_name TEXT;

-- Update existing courses with teacher names from profiles
UPDATE public.courses 
SET teacher_name = profiles.full_name
FROM public.profiles 
WHERE courses.teacher_id = profiles.user_id 
AND profiles.full_name IS NOT NULL 
AND profiles.full_name != '';

-- Update existing courses with email fallback where full_name is empty
UPDATE public.courses 
SET teacher_name = SPLIT_PART(profiles.email, '@', 1)
FROM public.profiles 
WHERE courses.teacher_id = profiles.user_id 
AND (courses.teacher_name IS NULL OR courses.teacher_name = '');