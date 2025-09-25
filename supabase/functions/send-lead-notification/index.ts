import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  leadId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId }: EmailRequest = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        chatbots(name),
        workspaces(name)
      `)
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new Error('Lead not found');
    }

    // Get email integration config
    const { data: integration } = await supabase
      .from('integrations')
      .select('config')
      .eq('workspace_id', lead.workspace_id)
      .eq('integration_type', 'email')
      .eq('is_active', true)
      .single();

    if (!integration?.config) {
      console.log('No email integration found for workspace');
      return new Response(JSON.stringify({ success: false, message: 'No email integration configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config = integration.config as any;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Send email notification
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from_email || 'notifications@resend.dev',
        to: config.recipients || ['admin@example.com'],
        subject: config.subject_template?.replace('{chatbot_name}', lead.chatbots?.name || 'Chatbot') || 'New Lead Captured',
        html: `
          <h2>New Lead Captured</h2>
          <p><strong>Chatbot:</strong> ${lead.chatbots?.name || 'Unknown'}</p>
          <p><strong>Workspace:</strong> ${lead.workspaces?.name || 'Unknown'}</p>
          <p><strong>Name:</strong> ${lead.name || 'Not provided'}</p>
          <p><strong>Email:</strong> ${lead.email || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
          <p><strong>Company:</strong> ${lead.company || 'Not provided'}</p>
          <p><strong>Source:</strong> ${lead.source}</p>
          <p><strong>Date:</strong> ${new Date(lead.created_at).toLocaleString()}</p>
          ${lead.additional_data ? `<p><strong>Additional Data:</strong> ${JSON.stringify(lead.additional_data, null, 2)}</p>` : ''}
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log('Email sent:', emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-lead-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);