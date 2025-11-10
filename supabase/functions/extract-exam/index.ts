import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to generate hash from image data
async function generateImageHash(imageData: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(imageData);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: "Image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate hash of the image
    const imageHash = await generateImageHash(image);
    console.log("Image hash generated:", imageHash);

    // Check cache for existing extraction
    const { data: cachedData, error: cacheError } = await supabase
      .from("extraction_cache")
      .select("extracted_data")
      .eq("user_id", user.id)
      .eq("image_hash", imageHash)
      .eq("extraction_type", "exam")
      .maybeSingle();

    if (cachedData && !cacheError) {
      console.log("Cache hit! Returning cached extraction");
      return new Response(
        JSON.stringify({ ...cachedData.extracted_data, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Cache miss. Processing exam...");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um assistente especializado em extrair informações de exames médicos.
Analise a imagem do exame e extraia:
1. Tipo de exame (hemograma, glicemia, colesterol, etc.)
2. Data do exame
3. Valores principais e seus resultados
4. Valores de referência quando disponíveis
5. Observações importantes

Retorne APENAS um JSON válido no formato:
{
  "exam_type": "tipo do exame",
  "exam_date": "data no formato YYYY-MM-DD",
  "results": [
    {
      "parameter": "nome do parâmetro",
      "value": "valor",
      "reference": "valor de referência",
      "unit": "unidade"
    }
  ],
  "notes": "observações importantes"
}

Se não conseguir identificar, retorne um JSON com campos vazios.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise este exame médico e extraia as informações solicitadas."
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", data);

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "No content in AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse exam info" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate confidence score
    const totalFields = 4; // exam_type, exam_date, results, notes
    let filledFields = 0;
    if (result.exam_type && result.exam_type.trim().length > 0) filledFields++;
    if (result.exam_date) filledFields++;
    if (result.results && result.results.length > 0) filledFields++;
    if (result.notes && result.notes.trim().length > 0) filledFields++;
    
    const confidence = filledFields / totalFields;
    const status = confidence >= 0.6 ? 'pending_review' : 'failed';

    console.log(`Exam extraction confidence: ${confidence.toFixed(2)} (${filledFields}/${totalFields} fields)`);

    // Save to cache
    try {
      await supabase
        .from("extraction_cache")
        .insert({
          user_id: user.id,
          image_hash: imageHash,
          extraction_type: "exam",
          extracted_data: { ...result, confidence, status }
        });
      console.log("Extraction saved to cache");
    } catch (cacheInsertError) {
      console.error("Failed to save to cache:", cacheInsertError);
      // Don't fail the request if cache save fails
    }

    return new Response(
      JSON.stringify({ ...result, confidence, status, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-exam function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
