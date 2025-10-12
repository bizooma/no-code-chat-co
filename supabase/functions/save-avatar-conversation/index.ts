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
    const { conversationId, chatbotId, visitorId, messages, sessionDuration } = await req.json();

    if (!chatbotId || !visitorId) {
      throw new Error('Missing required fields: chatbotId and visitorId');
    }

    console.log('Saving conversation:', { conversationId, chatbotId, visitorId });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (conversationId) {
      // Update existing conversation
      const { error: updateError } = await supabase
        .from('avatar_conversations')
        .update({ 
          messages: messages || [], 
          session_duration: sessionDuration 
        })
        .eq('id', conversationId);

      if (updateError) {
        console.error('Error updating conversation:', updateError);
        throw updateError;
      }

      console.log('Conversation updated successfully');

      return new Response(JSON.stringify({ 
        success: true, 
        conversationId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Create new conversation
      const { data, error: insertError } = await supabase
        .from('avatar_conversations')
        .insert({
          chatbot_id: chatbotId,
          visitor_id: visitorId,
          messages: messages || [],
          session_duration: sessionDuration
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating conversation:', insertError);
        throw insertError;
      }

      console.log('Conversation created successfully:', data.id);

      return new Response(JSON.stringify({ 
        success: true, 
        conversationId: data.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error saving avatar conversation:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to save conversation' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
