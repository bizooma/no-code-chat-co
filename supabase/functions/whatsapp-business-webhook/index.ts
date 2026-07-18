import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifySignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const expected = signatureHeader.slice('sha256='.length);
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  // constant-time compare
  if (hex.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[WHATSAPP-BUSINESS] Request received:', req.method);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') ?? '';
    const APP_SECRET = Deno.env.get('META_APP_SECRET') ?? '';

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && VERIFY_TOKEN && token === VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
      }
      return new Response('Verification failed', { status: 403 });
    }

    if (req.method === 'POST') {
      const rawBody = await req.text();
      if (!APP_SECRET || !(await verifySignature(rawBody, req.headers.get('x-hub-signature-256'), APP_SECRET))) {
        console.warn('[WHATSAPP-BUSINESS] Invalid signature');
        return new Response('Invalid signature', { status: 401 });
      }
      const body = JSON.parse(rawBody);

      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === 'messages' && change.value.messages) {
                for (const message of change.value.messages) {
                  await handleWhatsAppMessage(supabaseClient, message, change.value);
                }
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    return new Response('Method not allowed', { status: 405 });


  } catch (error) {
    console.error('[WHATSAPP-BUSINESS] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleWhatsAppMessage(supabaseClient: any, message: any, value: any) {
  console.log('[WHATSAPP-BUSINESS] Processing message:', message);

  if (message.type === 'text' && message.text?.body) {
    const senderId = message.from;
    const messageText = message.text.body;
    const phoneNumberId = value.metadata.phone_number_id;

    // Find the workspace and chatbot for this WhatsApp phone number
    const { data: integration } = await supabaseClient
      .from('integrations')
      .select('*, workspace_id, chatbots(id, name)')
      .eq('integration_type', 'whatsapp_business')
      .eq('config->>phone_number_id', phoneNumberId)
      .eq('is_active', true)
      .single();

    if (!integration || !integration.chatbots) {
      console.log('[WHATSAPP-BUSINESS] No active integration found for phone number:', phoneNumberId);
      return;
    }

    // Find or create conversation
    let { data: conversation } = await supabaseClient
      .from('conversations')
      .select('id')
      .eq('chatbot_id', integration.chatbots.id)
      .eq('visitor_id', senderId)
      .eq('channel', 'whatsapp')
      .eq('status', 'active')
      .single();

    if (!conversation) {
      const { data: newConversation, error } = await supabaseClient
        .from('conversations')
        .insert({
          chatbot_id: integration.chatbots.id,
          visitor_id: senderId,
          channel: 'whatsapp',
          status: 'active'
        })
        .select('id')
        .single();

      if (error) {
        console.error('[WHATSAPP-BUSINESS] Error creating conversation:', error);
        return;
      }
      conversation = newConversation;
    }

    // Store the incoming message
    await supabaseClient
      .from('conversation_messages')
      .insert({
        conversation_id: conversation.id,
        sender: 'user',
        message_text: messageText,
        channel: 'whatsapp',
        external_message_id: message.id,
        platform_metadata: {
          sender_id: senderId,
          phone_number_id: phoneNumberId,
          timestamp: message.timestamp
        }
      });

    // Get chatbot response
    const botResponse = await generateBotResponse(supabaseClient, integration.chatbots.id, messageText);

    // Send response back to WhatsApp
    if (botResponse) {
      await sendWhatsAppMessage(integration.config.access_token, phoneNumberId, senderId, botResponse);
      
      // Store bot response
      await supabaseClient
        .from('conversation_messages')
        .insert({
          conversation_id: conversation.id,
          sender: 'bot',
          message_text: botResponse,
          channel: 'whatsapp'
        });
    }
  }
}

async function generateBotResponse(supabaseClient: any, chatbotId: string, userMessage: string) {
  // Get chatbot configuration
  const { data: chatbot } = await supabaseClient
    .from('chatbots')
    .select('welcome_message, fallback_message')
    .eq('id', chatbotId)
    .single();

  // Simple response logic - you can extend this with AI or flow-based responses
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('ola')) {
    return chatbot?.welcome_message || "Hello! How can I help you today?";
  }
  
  return chatbot?.fallback_message || "I'm sorry, I didn't understand that. Can you please rephrase?";
}

async function sendWhatsAppMessage(accessToken: string, phoneNumberId: string, recipientId: string, message: string) {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipientId,
        text: { body: message }
      })
    });

    const result = await response.json();
    console.log('[WHATSAPP-BUSINESS] Message sent:', result);
    
    return result;
  } catch (error) {
    console.error('[WHATSAPP-BUSINESS] Error sending message:', error);
    throw error;
  }
}