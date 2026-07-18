import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  leadId?: string;
  test?: boolean;
  lead?: any;
  workspaceId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: EmailRequest = await req.json().catch(() => ({} as EmailRequest));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let lead: any;
    let workspaceId: string | undefined;

    if (body.leadId) {
      const { data, error } = await supabase
        .from('leads')
        .select(`*, chatbots(name), workspaces(name)`)
        .eq('id', body.leadId)
        .single();
      if (error || !data) {
        throw new Error('Lead not found');
      }
      lead = data;
      workspaceId = data.workspace_id;
    } else if (body.lead) {
      lead = {
        name: body.lead.name ?? 'Test User',
        email: body.lead.email ?? 'test@example.com',
        phone: body.lead.phone ?? null,
        company: body.lead.company ?? null,
        source: body.lead.source ?? 'test',
        created_at: new Date().toISOString(),
        additional_data: body.lead.additional_data ?? null,
        chatbots: { name: body.lead.chatbot_name ?? 'Test Chatbot' },
        workspaces: { name: body.lead.workspace_name ?? 'Test Workspace' },
      };
      workspaceId = body.workspaceId;
    } else {
      throw new Error('Provide either leadId or a lead payload');
    }

    // Find email integration for this workspace (if any).
    let config: any = null;
    if (workspaceId) {
      const { data: integration } = await supabase
        .from('integrations')
        .select('config')
        .eq('workspace_id', workspaceId)
        .eq('integration_type', 'email')
        .eq('is_active', true)
        .maybeSingle();
      config = integration?.config ?? null;
    }

    // Test calls may include ad-hoc recipients/subject overrides
    const recipients = body.lead?.recipients ?? config?.recipients ?? null;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      console.log('No recipients configured for workspace', workspaceId);
      return new Response(JSON.stringify({ success: false, message: 'No email integration configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const fromEmail = config?.from_email || 'notifications@resend.dev';
    const subject = (config?.subject_template || 'New Lead Captured')
      .replace('{chatbot_name}', lead.chatbots?.name || 'Chatbot');

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients,
        subject,
        html: `
          <h2>New Lead Captured${body.test ? ' (Test)' : ''}</h2>
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