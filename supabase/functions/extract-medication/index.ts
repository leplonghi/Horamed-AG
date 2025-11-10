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

    // Validate image format
    if (!image.startsWith('data:image/')) {
      console.error("Invalid image format - must be base64 with data URI");
      return new Response(
        JSON.stringify({ error: "Invalid image format. Must be a base64 data URI (data:image/...)" }),
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
      .eq("extraction_type", "medication")
      .maybeSingle();

    if (cachedData && !cacheError) {
      console.log("Cache hit! Returning cached extraction");
      return new Response(
        JSON.stringify({ ...cachedData.extracted_data, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Cache miss. Calling Lovable AI for medication extraction...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Call Lovable AI with vision to extract medication info
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
            content: `Você é um assistente especializado em identificar medicamentos, suplementos e vitaminas a partir de imagens de caixas/rótulos/receitas.
Analise a imagem e extraia:
1. Nome do medicamento/suplemento
2. Dosagem (mg, g, UI, etc.)
3. Categoria (medicamento, suplemento, vitamina, ou pet)
4. Duração do tratamento em dias (se especificado na receita, ex: "por 7 dias", "durante 14 dias")
5. Número total de doses (se especificado, ex: "21 doses", "tomar 30 comprimidos")
6. Data de início do tratamento (se especificado, no formato YYYY-MM-DD)

Retorne APENAS um JSON válido no formato:
{
  "name": "Nome do produto",
  "dose": "Dosagem completa",
  "category": "medicamento|suplemento|vitamina|pet",
  "duration_days": número ou null,
  "total_doses": número ou null,
  "start_date": "YYYY-MM-DD" ou null
}

Se não conseguir identificar algum campo, use null para campos numéricos/data e "" para strings.
Exemplo:
{
  "name": "Amoxicilina",
  "dose": "500mg",
  "category": "medicamento",
  "duration_days": 7,
  "total_doses": 21,
  "start_date": null
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta imagem de medicamento/suplemento e extraia as informações solicitadas."
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
      
      if (response.status === 400) {
        return new Response(
          JSON.stringify({ 
            error: "Erro ao processar imagem. Verifique se a imagem está no formato correto.",
            details: errorText 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Parse the JSON response from AI
    let result;
    try {
      // Extract JSON from markdown code block if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse medication info" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to cache
    try {
      await supabase
        .from("extraction_cache")
        .insert({
          user_id: user.id,
          image_hash: imageHash,
          extraction_type: "medication",
          extracted_data: result
        });
      console.log("Extraction saved to cache");
    } catch (cacheInsertError) {
      console.error("Failed to save to cache:", cacheInsertError);
      // Don't fail the request if cache save fails
    }

    return new Response(
      JSON.stringify({ ...result, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-medication function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
