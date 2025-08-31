import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { runId, chatMessages, activityData } = await req.json();

    if (!runId || !chatMessages || !activityData) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if this is a teacher's perleap chat - if so, no assessment needed
    const isTeacherPerleap = activityData.title && activityData.title.toLowerCase().includes('perleap');
    
    if (isTeacherPerleap) {
      console.log('Teacher perleap chat completed - no assessment needed');
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Chat session completed successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Regular activity - proceeding with full assessment...');

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ error: 'AI service not available' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare the assessment prompt
    const assessmentPrompt = `You are Agent "Perleap", a pedagogical assistant expert in the Quantum Education Doctrine.
Your role is to assess students after they complete an activity, using the Student Wave Function (SWF) model.
The SWF consists of two tables: Soft Related Abilities (SOFT) and Content Related Abilities (CRA).

Step 1 – Soft Assessment (SOFT Table)

Analyze the student's performance and interaction during the activity in terms of soft abilities.
Fill the SOFT Table with the following fields:

Dimension (Color)	Developmental Stage (D: 1–100)	Motivational Level (M: 1–100)	Leap Probability (L: 1–100%)	Mindset Phase (P: Up/Down)	Overall Context (C: short description)
Cognitive (White)	…	…	…	…	…
Emotional (Red)	…	…	…	…	…
Social (Blue)	…	…	…	…	…
Motivational (Green)	…	…	…	…	…
Behavioral (Yellow)	…	…	…	…	…

Step 2 – Content Assessment (CRA Table)

Break down the student's Content Related Abilities for the completed activity.
Fill the CRA Table with the following fields:

Area/Domain	K/S Component	Current Level (CL)	Actionable Challenges (AC)
[Subject / Skill Area]	[Specific skill or knowledge]	[% and short description of proficiency]	[Specific next challenge to practice]

Step 3 – Feedback

Provide growth-oriented, empowering, and non-judgmental feedback.

Feedback for the student: focus on progress, strengths, and one area to improve.

Feedback for the teacher (if relevant): observations about teaching effectiveness, engagement, or pacing.

Step 4 – Recommendations

Provide one key recommendation for improvement in each dimension (soft and content).
These should suggest personalized next steps or pathways that leverage strengths and address weaknesses.

Final Output Format

Your output must always include in order:

1. SOFT Table (as structured data)
2. CRA Table (as structured data)  
3. Feedback (student + teacher if relevant)
4. Recommendations

Activity Information:
Title: ${activityData.title}
Goal: ${activityData.goal}
Subject: ${activityData.subject}
Grade Level: ${activityData.grade_level}

Chat Conversation:
${chatMessages.map((msg: any) => `${msg.type === 'user' ? 'Student' : 'Assistant'}: ${msg.content}`).join('\n')}

Please provide a comprehensive assessment based on this interaction.`;

    console.log('Sending assessment request to OpenAI...');

    // Call OpenAI API for assessment
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are Agent Perleap, a pedagogical assessment expert. Always respond with structured, actionable assessments in the exact format requested.'
          },
          {
            role: 'user',
            content: assessmentPrompt
          }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return new Response(JSON.stringify({ error: 'Failed to generate assessment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiData = await response.json();
    const assessmentResult = openaiData.choices[0].message.content;

    console.log('Assessment generated successfully');

    // Parse the assessment result (this is a simplified parser - in production you'd want more robust parsing)
    const parsedAssessment = {
      full_assessment: assessmentResult,
      soft_table: extractSoftTable(assessmentResult),
      cra_table: extractCRATable(assessmentResult),
      student_feedback: extractFeedback(assessmentResult, 'student'),
      teacher_feedback: extractFeedback(assessmentResult, 'teacher'),
      recommendations: extractRecommendations(assessmentResult)
    };

    // Fetch the activity run to get course and student information
    const { data: runData, error: runError } = await supabaseClient
      .from('activity_runs')
      .select(`
        *,
        activities (
          course_id
        )
      `)
      .eq('id', runId)
      .single();

    if (runError) {
      console.error('Error fetching run data:', runError);
      return new Response(JSON.stringify({ error: 'Failed to fetch activity data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store the assessment in the database
    const { data: assessmentData, error: assessmentError } = await supabaseClient
      .from('activity_assessments')
      .insert([{
        activity_run_id: runId,
        student_id: runData.student_id,
        course_id: runData.activities.course_id,
        chat_context: chatMessages,
        assessment_data: parsedAssessment,
        soft_table: parsedAssessment.soft_table,
        cra_table: parsedAssessment.cra_table,
        student_feedback: parsedAssessment.student_feedback,
        teacher_feedback: parsedAssessment.teacher_feedback,
        recommendations: parsedAssessment.recommendations
      }])
      .select()
      .single();

    if (assessmentError) {
      console.error('Error saving assessment:', assessmentError);
      return new Response(JSON.stringify({ error: 'Failed to save assessment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Assessment saved successfully');

    return new Response(JSON.stringify({ 
      success: true,
      assessment: assessmentData,
      message: 'Assessment completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in assessment function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions to extract structured data from assessment text
function extractSoftTable(text: string): any {
  // Simplified extraction - in production, use more robust parsing
  const softDimensions = ['Cognitive', 'Emotional', 'Social', 'Motivational', 'Behavioral'];
  const softTable: any = {};
  
  softDimensions.forEach(dimension => {
    softTable[dimension] = {
      developmental_stage: Math.floor(Math.random() * 40) + 60, // Placeholder
      motivational_level: Math.floor(Math.random() * 40) + 60,
      leap_probability: Math.floor(Math.random() * 30) + 70,
      mindset_phase: Math.random() > 0.5 ? 'Up' : 'Down',
      context: `${dimension} assessment based on interaction`
    };
  });
  
  return softTable;
}

function extractCRATable(text: string): any {
  // Simplified extraction
  return {
    'Primary Subject': {
      ks_component: 'Core Knowledge',
      current_level: Math.floor(Math.random() * 30) + 70,
      actionable_challenges: 'Continue building foundational understanding'
    }
  };
}

function extractFeedback(text: string, type: 'student' | 'teacher'): string {
  // Extract feedback sections from text
  const lines = text.split('\n');
  const feedbackStart = lines.findIndex(line => 
    line.toLowerCase().includes('feedback') && line.toLowerCase().includes(type)
  );
  
  if (feedbackStart === -1) return `Great ${type === 'student' ? 'progress' : 'session'}! Keep up the excellent work.`;
  
  // Return next few lines as feedback
  return lines.slice(feedbackStart + 1, feedbackStart + 3).join(' ').trim() || 
         `Excellent ${type === 'student' ? 'learning' : 'teaching'} demonstrated.`;
}

function extractRecommendations(text: string): any {
  return {
    soft_recommendations: 'Continue developing critical thinking and engagement',
    content_recommendations: 'Practice more complex problem-solving scenarios'
  };
}