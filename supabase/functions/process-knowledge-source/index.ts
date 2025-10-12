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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { chatbotId, sourceType, sourceName, sourceData } = await req.json();

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
        // For PDF and DOCX, we'd need a document parsing service
        // For now, store the file URL and mark for manual processing
        content = `File uploaded: ${sourceName}. Manual text extraction required.`;
        metadata.requiresProcessing = true;
      }
      
      metadata.fileSize = sourceData.fileSize;
      metadata.fileType = extension;
    } else if (sourceType === 'url') {
      // Scrape URL
      try {
        console.log('[PROCESS-KNOWLEDGE] Fetching URL:', sourceData);
        const response = await fetch(sourceData, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBot/1.0)',
          },
        });
        
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
