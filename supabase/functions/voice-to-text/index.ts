import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, mimeType = 'audio/webm' } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing audio for transcription, mime type:', mimeType);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use Gemini 2.5 Flash for audio transcription (supports audio natively)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'HoraMed Voice Transcription',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Você é um transcritor de áudio profissional. Transcreva o áudio a seguir para texto em português brasileiro.

REGRAS IMPORTANTES:
- Retorne APENAS o texto transcrito, sem explicações, prefixos ou formatação
- Corrija erros de gramática óbvios
- Use pontuação apropriada
- Se não conseguir entender o áudio, retorne exatamente: [inaudível]
- Não adicione nada além da transcrição`
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: audio,
                  format: mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'wav'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      // Parse error for better debugging
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Error details:', JSON.stringify(errorJson, null, 2));
      } catch {
        // Not JSON, already logged
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('AI response received');
    
    const transcribedText = result.choices?.[0]?.message?.content?.trim() || '';

    // Clean up the transcription
    let cleanText = transcribedText
      .replace(/^(transcrição|texto|áudio):\s*/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    // Check for inaudible marker
    if (cleanText.toLowerCase().includes('[inaudível]') || cleanText.length < 2) {
      cleanText = '';
    }

    console.log('Transcription result:', cleanText.substring(0, 100) + (cleanText.length > 100 ? '...' : ''));

    return new Response(
      JSON.stringify({ text: cleanText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in voice-to-text:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});