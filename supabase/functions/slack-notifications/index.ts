import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[SLACK-NOTIFICATIONS] Request received');

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { workspace_id, lead, test = false } = await req.json();
    console.log('[SLACK-NOTIFICATIONS] Processing notification:', { workspace_id, lead, test });

    // Get Slack integration for the workspace
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('integration_type', 'slack')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      console.log('[SLACK-NOTIFICATIONS] No active Slack integration found');
      return new Response(JSON.stringify({ error: 'No active Slack integration found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const webhookUrl = integration.config?.webhook_url;
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    // Format lead information for Slack
    const leadInfo = [
      lead.name ? `*Name:* ${lead.name}` : null,
      lead.email ? `*Email:* ${lead.email}` : null,
      lead.phone ? `*Phone:* ${lead.phone}` : null,
      lead.company ? `*Company:* ${lead.company}` : null,
      lead.chatbot ? `*Chatbot:* ${lead.chatbot}` : null,
      lead.source ? `*Source:* ${lead.source}` : null
    ].filter(Boolean).join('\n');

    const slackMessage = {
      text: test ? '🧪 Test Lead Notification' : '🎯 New Lead Captured!',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: test ? '🧪 Test Lead Notification' : '🎯 New Lead Captured!',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: leadInfo || 'No lead information provided'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Timestamp: ${new Date().toLocaleString()}`
            }
          ]
        }
      ]
    };

    // Send to Slack
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage)
    });

    const responseText = await response.text();
    console.log('[SLACK-NOTIFICATIONS] Slack response:', response.status, responseText);

    // Log the webhook delivery
    await supabaseClient
      .from('webhook_logs')
      .insert({
        workspace_id: workspace_id,
        webhook_url: webhookUrl,
        event_type: test ? 'slack_test_notification' : 'slack_lead_notification',
        payload: slackMessage,
        response_status: response.status,
        response_body: responseText,
        delivered_at: response.ok ? new Date().toISOString() : null
      });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${responseText}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Slack notification sent successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[SLACK-NOTIFICATIONS] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});