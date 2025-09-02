import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Activity chat edge function loaded");

serve(async (req) => {
  console.log(`=== NEW REQUEST ===`);
  console.log(`Method: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing POST request");

    // Initialize Supabase client with user authorization
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
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - Please sign in'
      }), {
        status: 401,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      });
    }

    // Check OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log("OpenAI API key check:", openAIApiKey ? 'Found' : 'Missing');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Parse request body
    const body = await req.text();
    console.log(`Request body length: ${body.length}`);
    
    const data = JSON.parse(body);
    const { activityId, message, conversationHistory = [] } = data;
    console.log(`Activity ID: ${activityId}`);
    console.log(`Message received: ${message ? 'Yes' : 'No'}`);
    console.log(`Conversation history length: ${conversationHistory.length}`);

    if (!message) {
      throw new Error('Message is required');
    }

    if (!activityId) {
      throw new Error('Activity ID is required');
    }

    // Get activity and course information with teacher details
    const { data: activityData, error: activityError } = await supabaseClient
      .from('activities')
      .select(`
        *,
        courses (
          id,
          title,
          subject,
          grade_level,
          description,
          teacher_id,
          profiles!courses_teacher_id_fkey (
            full_name,
            email
          )
        )
      `)
      .eq('id', activityId)
      .single();

    console.log('Activity query result:', { activityData, activityError });

    if (activityError || !activityData) {
      throw new Error(`Activity not found: ${activityError?.message}`);
    }

    const course = activityData.courses;
    const teacher = course?.profiles;
    const teacherName = teacher?.full_name || teacher?.email?.split('@')[0] || 'Teacher';

    console.log(`Course: ${course?.title}, Teacher: ${teacherName}`);

    // Create contextual system prompt
    const systemPrompt = `You are ${teacherName}, an experienced and passionate ${course?.subject} teacher for Grade ${course?.grade_level}. 

COURSE CONTEXT:
- Course: ${course?.title}
- Subject: ${course?.subject}
- Grade Level: Grade ${course?.grade_level}
- Course Description: ${course?.description || 'No description available'}

ACTIVITY CONTEXT:
- Activity: ${activityData.title}
- Goal: ${activityData.goal || 'General learning support'}
- Focus: ${activityData.custom_focus || course?.subject}
- Content: ${activityData.activity_content || 'Interactive learning session'}

TEACHING PERSONA:
You are speaking AS ${teacherName}, the actual teacher of this course. You should:
- Respond as if you are personally teaching this student
- Reference your expertise in ${course?.subject}
- Stay focused on the course content and curriculum for Grade ${course?.grade_level}
- Be encouraging, supportive, and educational
- Ask follow-up questions to assess understanding
- Provide clear, age-appropriate explanations suitable for Grade ${course?.grade_level} students
- Guide students through topics step by step
- Reference previous lessons or upcoming topics when relevant
- Use "I" when referring to yourself as the teacher

IMPORTANT: Only discuss topics related to ${course?.subject} and this ${course?.title} course. If students ask about other subjects, politely redirect them to focus on our ${course?.subject} coursework.

Always maintain the persona of ${teacherName}, their dedicated ${course?.subject} teacher.`;

    // Prepare conversation messages
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (limit to last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role && msg.content) {
        messages.push({
          role: msg.role === 'student' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    console.log("Calling OpenAI API with contextual prompt...");

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 800,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }),
    });

    console.log(`OpenAI response status: ${openaiResponse.status}`);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI response received successfully');
    
    const aiResponse = openaiData.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      console.error('No response content from OpenAI');
      throw new Error('No response generated by AI');
    }

    console.log(`AI response length: ${aiResponse.length}`);

    // Format the AI response to remove excessive markdown and improve readability
    const formatResponse = (text: string): string => {
      return text
        // Remove excessive asterisks (bold formatting)
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        // Remove single asterisks (italic formatting) 
        .replace(/\*([^*]+)\*/g, '$1')
        // Clean up extra whitespace
        .replace(/\n{3,}/g, '\n\n')
        // Remove markdown headers that might be excessive
        .replace(/#{1,6}\s+/g, '')
        .trim();
    };

    const formattedResponse = formatResponse(aiResponse);

    // Return successful response
    const response = {
      success: true,
      response: formattedResponse
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    console.error(`ERROR STACK: ${error.stack}`);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Function error: ${error.message}`
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});