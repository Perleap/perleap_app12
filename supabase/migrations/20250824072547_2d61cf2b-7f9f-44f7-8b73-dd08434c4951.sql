-- Update existing draft activities to active status so students can see them
UPDATE activities 
SET status = 'active' 
WHERE status = 'draft';