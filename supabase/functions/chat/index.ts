import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { runId, message } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!;
    supabaseClient.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: '',
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the activity run
    const { data: run, error: runError } = await supabaseClient
      .from('activity_runs')
      .select(`
        *,
        activities (
          id,
          title,
          type,
          goal,
          config
        )
      `)
      .eq('id', runId)
      .eq('student_id', user.id)
      .single();

    if (runError || !run) {
      console.error('Run error:', runError);
      return new Response(JSON.stringify({ error: 'Activity run not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add user message to the run
    const currentMessages = run.messages || [];
    const userMessage = {
      id: Date.now(),
      type: 'student',
      content: message,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...currentMessages, userMessage];

    // Check if OpenAI API key is available
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      // Return without AI response if no API key
      const { error: updateError } = await supabaseClient
        .from('activity_runs')
        .update({ messages: updatedMessages })
        .eq('id', runId);

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update messages' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        message: userMessage,
        aiResponse: null,
        warning: 'OpenAI API key not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate AI response using OpenAI
    const systemPrompt = `You are an educational AI assistant helping a student with "${run.activities.title}". 
    The learning goal is: ${run.activities.goal || 'Help the student understand the topic through guided conversation.'}
    
    Be encouraging, ask thought-provoking questions, and guide the student towards understanding.
    Keep responses concise and engaging. Build on their previous responses in the conversation.`;

    const conversationHistory = updatedMessages
      .filter(m => m.type === 'student' || m.type === 'assistant')
      .map(m => ({
        role: m.type === 'student' ? 'user' : 'assistant',
        content: m.content
      }));

    console.log('Sending request to OpenAI...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      
      // Update with user message only if OpenAI fails
      const { error: updateError } = await supabaseClient
        .from('activity_runs')
        .update({ messages: updatedMessages })
        .eq('id', runId);

      return new Response(JSON.stringify({ 
        message: userMessage,
        aiResponse: null,
        error: 'Failed to generate AI response'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await openAIResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Create AI response message
    const aiMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: aiContent,
      timestamp: new Date().toISOString()
    };

    const finalMessages = [...updatedMessages, aiMessage];

    // Update the activity run with both messages
    const { error: updateError } = await supabaseClient
      .from('activity_runs')
      .update({ messages: finalMessages })
      .eq('id', runId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update messages' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      message: userMessage,
      aiResponse: aiMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});