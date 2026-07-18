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
    const D_ID_API_KEY = Deno.env.get('D_ID_API_KEY');
    if (!D_ID_API_KEY) {
      throw new Error('D_ID_API_KEY not configured');
    }

    const { chatbotId, name, presenterId, voiceId, llmModel, systemPrompt, knowledgeBase } = await req.json();

    if (!chatbotId) {
      throw new Error('chatbotId is required');
    }

    console.log('Creating D-ID agent for chatbot:', chatbotId);

    // Load workspace knowledge sources so the agent can actually answer from them
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: sources } = await supabase
      .from('avatar_knowledge_sources')
      .select('source_name, content, status')
      .eq('chatbot_id', chatbotId)
      .eq('status', 'ready');

    const knowledgePieces: string[] = [];
    if (knowledgeBase && String(knowledgeBase).trim().length > 0) {
      knowledgePieces.push(String(knowledgeBase).trim());
    }
    for (const s of sources ?? []) {
      if (s?.content && String(s.content).trim().length > 0) {
        knowledgePieces.push(`# ${s.source_name}\n${s.content}`);
      }
    }

    const agentPayload: any = {
      presenter: {
        type: 'talk',
        presenter_id: presenterId,
        voice: {
          type: 'text',
          provider: {
            type: 'elevenlabs',
            voice_id: voiceId
          }
        }
      }
    };

    if (llmModel && systemPrompt) {
      agentPayload.llm = {
        type: llmModel.includes('gpt') ? 'openai' : 'anthropic',
        model: llmModel,
        instructions: systemPrompt
      };

      if (knowledgePieces.length > 0) {
        agentPayload.knowledge = [{
          type: 'text',
          content: knowledgePieces.join('\n\n---\n\n')
        }];
      }
    }

    console.log('Creating agent with payload:', JSON.stringify(agentPayload, null, 2));

    const createAgentResponse = await fetch('https://api.d-id.com/agents', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${D_ID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agentPayload)
    });

    if (!createAgentResponse.ok) {
      const errorText = await createAgentResponse.text();
      console.error('D-ID agent creation failed:', errorText);
      throw new Error(`Failed to create D-ID agent: ${errorText}`);
    }

    const agentData = await createAgentResponse.json();
    console.log('D-ID agent created:', agentData.id);

    // Generate client key for this agent
    const allowedDomains = [
      window.location?.origin,
      'http://localhost:8080',
      'https://*.lovable.app',
      '*' // Allow all domains for embedded widgets
    ].filter(Boolean);

    console.log('Generating client key for agent:', agentData.id);

    const clientKeyResponse = await fetch(`https://api.d-id.com/agents/${agentData.id}/client-key`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${D_ID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        allowed_domains: allowedDomains
      })
    });

    if (!clientKeyResponse.ok) {
      const errorText = await clientKeyResponse.text();
      console.error('Client key generation failed:', errorText);
      throw new Error(`Failed to generate client key: ${errorText}`);
    }

    const clientKeyData = await clientKeyResponse.json();
    console.log('Client key generated successfully');

    // Update chatbot in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('avatar_chatbots')
      .update({
        did_agent_id: agentData.id,
        did_client_key: clientKeyData.client_key,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatbotId);

    if (updateError) {
      console.error('Failed to update chatbot:', updateError);
      throw new Error(`Failed to update chatbot: ${updateError.message}`);
    }

    console.log('Chatbot updated with D-ID credentials');

    return new Response(
      JSON.stringify({
        success: true,
        agentId: agentData.id,
        clientKey: clientKeyData.client_key
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-did-agent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
