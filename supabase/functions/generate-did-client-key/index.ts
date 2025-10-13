import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      console.error('D_ID_API_KEY is not configured');
      throw new Error('D-ID API key is not configured');
    }

    const { allowedDomains = ['*'] } = await req.json().catch(() => ({}));

    console.log('Requesting D-ID client key for domains:', allowedDomains);

    // Create client key from D-ID API
    const response = await fetch('https://api.d-id.com/agents/client-keys', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${D_ID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        allowed_domains: allowedDomains
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('D-ID API error:', response.status, errorText);
      throw new Error(`D-ID API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('D-ID client key generated successfully');

    return new Response(JSON.stringify({ 
      clientKey: data.client_key,
      allowedDomains: data.allowed_domains 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating D-ID client key:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate client key' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
