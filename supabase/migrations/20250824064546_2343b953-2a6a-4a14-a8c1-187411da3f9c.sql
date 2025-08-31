-- Add missing columns to activities table for enhanced activity management
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS component_name TEXT,
ADD COLUMN IF NOT EXISTS sub_component_name TEXT,
ADD COLUMN IF NOT EXISTS activity_content TEXT,
ADD COLUMN IF NOT EXISTS custom_focus TEXT,
ADD COLUMN IF NOT EXISTS length TEXT DEFAULT 'auto';

-- Update difficulty column to use the new values (easy, medium, hard, auto)
-- First, update existing records to use 'auto' instead of 'adaptive'
UPDATE public.activities 
SET difficulty = 'auto' 
WHERE difficulty = 'adaptive';

-- Add check constraint for difficulty values
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS activities_difficulty_check;

ALTER TABLE public.activities 
ADD CONSTRAINT activities_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard', 'auto'));

-- Add check constraint for length values
ALTER TABLE public.activities 
ADD CONSTRAINT activities_length_check 
CHECK (length IN ('short', 'medium', 'long', 'auto'));