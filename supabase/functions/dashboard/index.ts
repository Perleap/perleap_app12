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
    const pathParts = url.pathname.split('/').filter(Boolean);
    const courseId = pathParts[pathParts.indexOf('courses') + 1];

    if (pathParts.includes('summary')) {
      // Get course summary for dashboard
      
      // Verify access to course
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

      // Get basic counts
      const [activitiesResult, enrollmentsResult, runsResult] = await Promise.all([
        supabaseClient
          .from('activities')
          .select('id, status')
          .eq('course_id', courseId),
        supabaseClient
          .from('course_enrollments')
          .select('student_id')
          .eq('course_id', courseId),
        supabaseClient
          .from('activity_runs')
          .select(`
            id,
            status,
            completed_at,
            activities!activity_runs_activity_id_fkey(course_id)
          `)
          .eq('activities.course_id', courseId)
      ]);

      const activities = activitiesResult.data || [];
      const enrollments = enrollmentsResult.data || [];
      const runs = runsResult.data || [];

      const completedRuns = runs.filter(run => run.status === 'completed');
      const recentRuns = runs
        .filter(run => run.completed_at)
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
        .slice(0, 10);

      // Get SRA snapshots for trends
      const { data: sraSnapshots } = await supabaseClient
        .from('sra_snapshots')
        .select('dimension, d_score, m_score, created_at')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      // Calculate SRA averages by dimension
      const sraByDimension = {};
      sraSnapshots?.forEach(snapshot => {
        if (!sraByDimension[snapshot.dimension]) {
          sraByDimension[snapshot.dimension] = {
            scores: [],
            avgD: 0,
            avgM: 0
          };
        }
        sraByDimension[snapshot.dimension].scores.push({
          d: snapshot.d_score,
          m: snapshot.m_score,
          date: snapshot.created_at
        });
      });

      Object.keys(sraByDimension).forEach(dim => {
        const scores = sraByDimension[dim].scores;
        sraByDimension[dim].avgD = scores.reduce((sum, s) => sum + s.d, 0) / scores.length;
        sraByDimension[dim].avgM = scores.reduce((sum, s) => sum + s.m, 0) / scores.length;
      });

      // Get CRA snapshots for trends
      const { data: craSnapshots } = await supabaseClient
        .from('cra_snapshots')
        .select('area, cl_percent, created_at')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      // Calculate CRA averages by area
      const craByArea = {};
      craSnapshots?.forEach(snapshot => {
        if (!craByArea[snapshot.area]) {
          craByArea[snapshot.area] = {
            scores: [],
            avgCL: 0
          };
        }
        craByArea[snapshot.area].scores.push({
          cl: snapshot.cl_percent,
          date: snapshot.created_at
        });
      });

      Object.keys(craByArea).forEach(area => {
        const scores = craByArea[area].scores;
        craByArea[area].avgCL = scores.reduce((sum, s) => sum + s.cl, 0) / scores.length;
      });

      const summary = {
        kpis: {
          students: enrollments.length,
          activities: activities.length,
          runs: runs.length,
          completionRate: runs.length > 0 ? (completedRuns.length / runs.length) * 100 : 0
        },
        sra: {
          byDim: Object.keys(sraByDimension).map(dim => ({
            dimension: dim,
            avgD: Math.round(sraByDimension[dim].avgD),
            avgM: Math.round(sraByDimension[dim].avgM),
            trend: sraByDimension[dim].scores.slice(0, 7).reverse() // Last 7 data points
          }))
        },
        cra: {
          byArea: Object.keys(craByArea).map(area => ({
            area,
            avgCL: Math.round(craByArea[area].avgCL),
            trend: craByArea[area].scores.slice(0, 7).reverse() // Last 7 data points
          }))
        },
        recentRuns: recentRuns.map(run => ({
          id: run.id,
          status: run.status,
          completedAt: run.completed_at
        }))
      };

      return new Response(JSON.stringify(summary), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Dashboard function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});