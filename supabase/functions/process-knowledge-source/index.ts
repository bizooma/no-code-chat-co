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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Require an authenticated caller who owns the target avatar bot's workspace
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { chatbotId, sourceType, sourceName, sourceData } = await req.json();

    // Ownership: caller must be a member of the avatar bot's workspace
    const { data: bot } = await supabase
      .from('avatar_chatbots')
      .select('id, workspace_id')
      .eq('id', chatbotId)
      .maybeSingle();
    if (!bot) {
      return new Response(JSON.stringify({ error: 'Chatbot not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isMember } = await supabase.rpc('is_workspace_member', {
      user_uuid: userData.user.id, workspace_uuid: (bot as any).workspace_id,
    });
    if (!isMember) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    console.log('[PROCESS-KNOWLEDGE] Processing knowledge source:', { chatbotId, sourceType, sourceName });

    let content = '';
    let fileUrl = null;
    let metadata: any = {};

    // Process based on source type
    if (sourceType === 'text') {
      content = sourceData;
    } else if (sourceType === 'file') {
      // File is already uploaded, just get the URL
      fileUrl = sourceData.fileUrl;
      
      // Extract text from file based on extension
      const extension = sourceName.split('.').pop()?.toLowerCase();
      
      if (extension === 'txt' || extension === 'md') {
        // Fetch and read text file
        const { data: fileData } = await supabase.storage
          .from('avatar-knowledge-files')
          .download(sourceData.filePath);
        
        if (fileData) {
          content = await fileData.text();
        }
      } else if (extension === 'pdf' || extension === 'docx') {
        return new Response(
          JSON.stringify({
            error: 'PDF and DOCX parsing is not yet supported. Please paste the text directly or upload a .txt or .md file.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      metadata.fileSize = sourceData.fileSize;
      metadata.fileType = extension;
    } else if (sourceType === 'url') {
      // Scrape URL — with SSRF protection
      try {
        console.log('[PROCESS-KNOWLEDGE] Fetching URL:', sourceData);

        let parsed: URL;
        try { parsed = new URL(sourceData); } catch {
          throw new Error('Invalid URL');
        }
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('Only http(s) URLs are allowed');
        }
        const host = parsed.hostname.toLowerCase();
        const blockedHostnames = ['localhost', 'metadata.google.internal', 'metadata.goog'];
        if (blockedHostnames.includes(host)) throw new Error('Blocked host');
        // Block IP literals in private / loopback / link-local ranges
        const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (ipv4) {
          const [a, b] = [parseInt(ipv4[1]), parseInt(ipv4[2])];
          if (
            a === 10 || a === 127 || a === 0 ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && b === 168) ||
            (a === 169 && b === 254) ||
            a >= 224
          ) throw new Error('Private/reserved IP blocked');
        }
        if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
          throw new Error('Private IPv6 blocked');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(parsed.toString(), {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBot/1.0)' },
          redirect: 'error',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        
        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Basic HTML text extraction (remove tags)
        content = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Limit content length
        if (content.length > 50000) {
          content = content.substring(0, 50000) + '... (truncated)';
        }
        
        metadata.url = sourceData;
        metadata.scrapedAt = new Date().toISOString();
      } catch (error) {
        console.error('[PROCESS-KNOWLEDGE] URL scraping error:', error);
        throw new Error(`Failed to scrape URL: ${error.message}`);
      }
    }

    // Insert knowledge source
    const { data: knowledgeSource, error: insertError } = await supabase
      .from('avatar_knowledge_sources')
      .insert({
        chatbot_id: chatbotId,
        source_type: sourceType,
        source_name: sourceName,
        content: content,
        metadata: metadata,
        file_url: fileUrl,
        status: 'ready',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[PROCESS-KNOWLEDGE] Insert error:', insertError);
      throw insertError;
    }

    console.log('[PROCESS-KNOWLEDGE] Knowledge source processed successfully:', knowledgeSource.id);

    return new Response(
      JSON.stringify({ success: true, knowledgeSource }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[PROCESS-KNOWLEDGE] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
