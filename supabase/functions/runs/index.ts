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
    
    if (method === 'POST' && pathParts.includes('activities')) {
      // Create run for activity
      const activityId = pathParts[pathParts.indexOf('activities') + 1];
      
      // Verify student is enrolled in course
      const { data: activity } = await supabaseClient
        .from('activities')
        .select(`
          id,
          course_id,
          status,
          courses!activities_course_id_fkey(
            id,
            course_enrollments!course_enrollments_course_id_fkey(student_id)
          )
        `)
        .eq('id', activityId)
        .eq('status', 'published')
        .single();

      if (!activity) {
        return new Response(JSON.stringify({ error: 'Activity not found or not published' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const isEnrolled = activity.courses.course_enrollments.some(
        (enrollment: any) => enrollment.student_id === user.id
      );

      if (!isEnrolled) {
        return new Response(JSON.stringify({ error: 'Not enrolled in course' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: run, error } = await supabaseClient
        .from('activity_runs')
        .insert({
          activity_id: activityId,
          student_id: user.id,
          status: 'created',
          messages: []
        })
        .select()
        .single();

      if (error) {
        console.error('Create run error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(run), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && pathParts.includes('start')) {
      // Start run
      const runId = pathParts[pathParts.indexOf('start') - 1];
      
      const { data: run, error } = await supabaseClient
        .from('activity_runs')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', runId)
        .eq('student_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Start run error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(run), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && pathParts.includes('message')) {
      // Add message to run
      const runId = pathParts[pathParts.indexOf('message') - 1];
      const { text } = await req.json();
      
      // Get current run
      const { data: currentRun } = await supabaseClient
        .from('activity_runs')
        .select('messages, activity_id')
        .eq('id', runId)
        .eq('student_id', user.id)
        .single();

      if (!currentRun) {
        return new Response(JSON.stringify({ error: 'Run not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const newMessage = {
        role: 'student',
        text,
        ts: new Date().toISOString()
      };

      const updatedMessages = [...(currentRun.messages || []), newMessage];

      // For Student-Chat activities, add an assistant response
      let assistantResponse = null;
      const { data: activity } = await supabaseClient
        .from('activities')
        .select('type')
        .eq('id', currentRun.activity_id)
        .single();

      if (activity?.type === 'Student-Chat') {
        assistantResponse = {
          role: 'assistant',
          text: `Thank you for your response: "${text}". Let me help you explore this further. What specific aspects would you like to discuss?`,
          ts: new Date().toISOString()
        };
        updatedMessages.push(assistantResponse);
      }

      const { data: run, error } = await supabaseClient
        .from('activity_runs')
        .update({ messages: updatedMessages })
        .eq('id', runId)
        .eq('student_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Add message error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        run,
        assistant: assistantResponse ? { streamed: false } : null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && pathParts.includes('complete')) {
      // Complete run
      const runId = pathParts[pathParts.indexOf('complete') - 1];
      
      const { data: run, error } = await supabaseClient
        .from('activity_runs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', runId)
        .eq('student_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Complete run error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        ...run,
        operatorJobs: [] // TODO: Implement operator queueing
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'GET') {
      const runId = pathParts[pathParts.length - 1];
      
      if (runId) {
        // Get run by ID
        const { data: run, error } = await supabaseClient
          .from('activity_runs')
          .select(`
            *,
            activities!activity_runs_activity_id_fkey(
              title,
              course_id,
              courses!activities_course_id_fkey(teacher_id)
            )
          `)
          .eq('id', runId)
          .single();

        if (error) {
          console.error('Get run error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check access - student can see their own runs, teachers can see runs in their courses
        const isStudent = run.student_id === user.id;
        const isTeacher = run.activities.courses.teacher_id === user.id;
        
        if (!isStudent && !isTeacher) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(run), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // List runs for student
        const courseId = url.searchParams.get('courseId');
        
        let query = supabaseClient
          .from('activity_runs')
          .select(`
            *,
            activities!activity_runs_activity_id_fkey(
              title,
              course_id
            )
          `)
          .eq('student_id', user.id);

        if (courseId) {
          query = query.eq('activities.course_id', courseId);
        }

        const { data: runs, error } = query;

        if (error) {
          console.error('List runs error:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ runs }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Runs function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});