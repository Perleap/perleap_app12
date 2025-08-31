-- Fix the user_can_view_course function search path
create or replace function public.user_can_view_course(course_id uuid, user_id uuid)
returns boolean
language plpgsql
stable 
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 
    from course_enrollments 
    where course_enrollments.course_id = $1 
    and course_enrollments.student_id = $2
  );
end;
$$;