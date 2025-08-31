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
    const courseId = url.pathname.split('/').pop();

    if (method === 'POST' && !courseId) {
      // Create course
      const { title, subject, grade_level, description, outline } = await req.json();
      
      const { data: course, error } = await supabaseClient
        .from('courses')
        .insert({
          title,
          subject,
          grade_level,
          description,
          teacher_id: user.id,
          cra_table: [],
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Create course error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(course), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'GET' && !courseId) {
      // List courses for user
      const userRole = url.searchParams.get('role') || 'teacher';
      
      let query = supabaseClient.from('courses').select(`
        *,
        activities!activities_course_id_fkey(count),
        course_enrollments!course_enrollments_course_id_fkey(count)
      `);

      if (userRole === 'teacher') {
        query = query.eq('teacher_id', user.id);
      } else {
        // Student - get enrolled courses
        query = query
          .select(`
            *,
            activities!activities_course_id_fkey(count),
            course_enrollments!course_enrollments_course_id_fkey(count)
          `)
          .in('id', 
            supabaseClient
              .from('course_enrollments')
              .select('course_id')
              .eq('student_id', user.id)
          );
      }

      const { data: courses, error } = await query;

      if (error) {
        console.error('List courses error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ courses }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'GET' && courseId) {
      // Get course by ID
      const { data: course, error } = await supabaseClient
        .from('courses')
        .select(`
          *,
          course_enrollments!course_enrollments_course_id_fkey(
            student_id,
            enrolled_at,
            profiles!course_enrollments_student_id_fkey(
              full_name,
              email
            )
          )
        `)
        .eq('id', courseId)
        .single();

      if (error) {
        console.error('Get course error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(course), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PATCH' && courseId) {
      // Update course
      const updates = await req.json();
      
      const { data: course, error } = await supabaseClient
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .eq('teacher_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Update course error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(course), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Courses function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});