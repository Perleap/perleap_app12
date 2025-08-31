import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const method = req.method;
    const pathParts = url.pathname.split('/').filter(Boolean);
    const courseId = pathParts[pathParts.indexOf('courses') + 1];

    if (method === 'POST' && pathParts.includes('students')) {
      // Enroll students in course
      const { studentIds } = await req.json();
      
      // Verify course ownership
      const { data: course } = await supabaseClient
        .from('courses')
        .select('teacher_id')
        .eq('id', courseId)
        .single();

      if (!course || course.teacher_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get existing enrollments to avoid duplicates
      const { data: existingEnrollments } = await supabaseClient
        .from('course_enrollments')
        .select('student_id')
        .eq('course_id', courseId)
        .in('student_id', studentIds);

      const existingIds = existingEnrollments?.map(e => e.student_id) || [];
      const newStudentIds = studentIds.filter((id: string) => !existingIds.includes(id));

      if (newStudentIds.length === 0) {
        return new Response(JSON.stringify({ ok: true, added: 0, message: 'All students already enrolled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const enrollments = newStudentIds.map((studentId: string) => ({
        course_id: courseId,
        student_id: studentId,
        enrolled_at: new Date().toISOString()
      }));

      const { data, error } = await supabaseClient
        .from('course_enrollments')
        .insert(enrollments)
        .select();

      if (error) {
        console.error('Enroll students error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ ok: true, added: data.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'GET' && pathParts.includes('students')) {
      // List students for teacher
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile?.role !== 'teacher') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get all students
      const { data: students, error } = await supabaseClient
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('role', 'student');

      if (error) {
        console.error('List students error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // If courseId provided, mark which students are already enrolled
      if (courseId) {
        const { data: enrollments } = await supabaseClient
          .from('course_enrollments')
          .select('student_id')
          .eq('course_id', courseId);

        const enrolledIds = enrollments?.map(e => e.student_id) || [];
        
        const studentsWithEnrollment = students?.map(student => ({
          id: student.user_id,
          name: student.full_name,
          email: student.email,
          enrolled: enrolledIds.includes(student.user_id)
        })) || [];

        return new Response(JSON.stringify({ students: studentsWithEnrollment }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const formattedStudents = students?.map(student => ({
        id: student.user_id,
        name: student.full_name,
        email: student.email
      })) || [];

      return new Response(JSON.stringify({ students: formattedStudents }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Enrollments function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});