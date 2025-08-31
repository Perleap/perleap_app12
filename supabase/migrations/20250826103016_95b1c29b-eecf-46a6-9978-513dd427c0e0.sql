-- Create default teacher activities for courses that don't have them
WITH missing_activities AS (
  SELECT 
    c.id as course_id,
    c.teacher_id,
    c.title as course_title,
    c.subject,
    p.full_name,
    p.email
  FROM courses c
  LEFT JOIN activities a ON c.id = a.course_id AND a.title ILIKE '%perleap'
  LEFT JOIN profiles p ON c.teacher_id = p.user_id
  WHERE a.id IS NULL
)
INSERT INTO activities (
  title,
  component_name,
  sub_component_name,
  goal,
  activity_content,
  custom_focus,
  difficulty,
  length,
  course_id,
  type,
  status
)
SELECT 
  COALESCE(ma.full_name, SPLIT_PART(ma.email, '@', 1), 'Teacher') || '''s Perleap',
  'Teacher Assistant',
  'AI Tutor',
  'Chat with an AI version of ' || COALESCE(ma.full_name, SPLIT_PART(ma.email, '@', 1), 'Teacher') || ' for personalized learning support in ' || ma.course_title || ' (' || ma.subject || ').',
  'This is an AI-powered teaching assistant that represents ' || COALESCE(ma.full_name, SPLIT_PART(ma.email, '@', 1), 'Teacher') || ' for the ' || ma.course_title || ' course. Students can ask questions, get help with coursework, and receive personalized guidance based on the course curriculum and subject matter.',
  'Personalized tutoring and ' || ma.subject || ' course support',
  'auto',
  'auto',
  ma.course_id,
  'Training',
  'active'
FROM missing_activities ma;