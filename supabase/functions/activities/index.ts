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
    const activityId = pathParts[pathParts.length - 1];

    if (method === 'POST' && !activityId) {
      // Create activity
      const { course_id, title, type, goal, difficulty = 'adaptive', config } = await req.json();
      
      // Verify course ownership
      const { data: course } = await supabaseClient
        .from('courses')
        .select('teacher_id')
        .eq('id', course_id)
        .single();

      if (!course || course.teacher_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: activity, error } = await supabaseClient
        .from('activities')
        .insert({
          course_id,
          title,
          type,
          goal,
          difficulty,
          config,
          status: 'draft'
        })
        .select()
        .single();

      if (error) {
        console.error('Create activity error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(activity), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'GET' && activityId) {
      // Get activity by ID
      const { data: activity, error } = await supabaseClient
        .from('activities')
        .select(`
          *,
          courses!activities_course_id_fkey(
            teacher_id,
            title as course_title
          )
        `)
        .eq('id', activityId)
        .single();

      if (error) {
        console.error('Get activity error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(activity), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PATCH' && activityId) {
      // Update activity
      const updates = await req.json();
      
      const { data: activity, error } = await supabaseClient
        .from('activities')
        .update(updates)
        .eq('id', activityId)
        .select(`
          *,
          courses!activities_course_id_fkey(teacher_id)
        `)
        .single();

      if (error) {
        console.error('Update activity error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user owns the course
      if (activity.courses.teacher_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(activity), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && pathParts.includes('publish')) {
      // Publish activity
      const activityId = pathParts[pathParts.indexOf('publish') - 1];
      
      const { data: activity, error } = await supabaseClient
        .from('activities')
        .update({ status: 'published' })
        .eq('id', activityId)
        .select(`
          *,
          courses!activities_course_id_fkey(teacher_id)
        `)
        .single();

      if (error) {
        console.error('Publish activity error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user owns the course
      if (activity.courses.teacher_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ id: activity.id, status: 'published' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Activities function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});