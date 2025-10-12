import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chatbotId, conversationHistory = [] } = await req.json();

    if (!message || !chatbotId) {
      throw new Error('Missing required fields: message and chatbotId');
    }

    console.log('Processing message for chatbot:', chatbotId);

    // Fetch chatbot configuration
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: chatbot, error: chatbotError } = await supabase
      .from('avatar_chatbots')
      .select('*')
      .eq('id', chatbotId)
      .single();

    if (chatbotError || !chatbot) {
      console.error('Chatbot not found:', chatbotError);
      throw new Error('Chatbot not found');
    }

    // Fetch knowledge sources
    const { data: knowledgeSources } = await supabase
      .from('avatar_knowledge_sources')
      .select('content, source_name')
      .eq('chatbot_id', chatbotId)
      .eq('status', 'ready');

    console.log('Found knowledge sources:', knowledgeSources?.length || 0);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    // Build messages for LLM
    let systemPrompt = chatbot.system_prompt || 'You are a helpful AI assistant. Keep your responses concise and conversational, suitable for being spoken by a video avatar.';
    
    // Add knowledge from multiple sources
    if (knowledgeSources && knowledgeSources.length > 0) {
      systemPrompt += '\n\nKnowledge Base:\n';
      knowledgeSources.forEach((source: any) => {
        systemPrompt += `\n--- ${source.source_name} ---\n${source.content}\n`;
      });
    }
    
    // Fallback to old knowledge_base field for backward compatibility
    if (chatbot.knowledge_base && (!knowledgeSources || knowledgeSources.length === 0)) {
      systemPrompt += `\n\nKnowledge Base:\n${chatbot.knowledge_base}`;
    }

    const messages = [
      { 
        role: 'system', 
        content: systemPrompt
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log('Calling OpenAI API with model:', chatbot.llm_model);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: chatbot.llm_model || 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 150, // Keep responses concise for avatar speech
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Generated AI response successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing avatar message:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process message',
        response: "I apologize, but I'm having trouble processing your request right now. Please try again."
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
