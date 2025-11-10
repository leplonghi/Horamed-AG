import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
      .eq("extraction_type", "document")
      .maybeSingle();

    if (cachedData && !cacheError) {
      console.log("Cache hit! Returning cached extraction");
      return new Response(
        JSON.stringify({ ...cachedData.extracted_data, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Cache miss. Processing document...");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const prompt = `Você é um assistente médico especializado em extrair informações PRECISAS de documentos de saúde.

Analise CUIDADOSAMENTE este documento e extraia as seguintes informações em formato JSON:

1. **title**: Nome EXATO do exame/documento como aparece no cabeçalho (obrigatório)
   - Exemplos: "Hemograma Completo", "Glicemia de Jejum", "Atestado Médico"

2. **issued_at**: Data de COLETA/EMISSÃO do documento em formato YYYY-MM-DD
   - Procure por: "Data de coleta", "Data do exame", "Data de emissão", "Coletado em"
   - Se houver múltiplas datas, use a data de COLETA do exame ou emissão do documento

3. **expires_at**: Data de validade (YYYY-MM-DD) - APENAS se explicitamente mencionada
   - Receitas médicas geralmente têm validade
   - Deixe null se não houver validade explícita

4. **provider**: Nome COMPLETO do laboratório/clínica/hospital
   - Procure no cabeçalho ou rodapé do documento
   - Exemplos: "Laboratório Sabin", "Hospital Albert Einstein", "Clínica São Lucas"
   - Se não encontrar, retorne null

5. **category**: Classifique CORRETAMENTE o tipo de documento:
   - "exame": Exames laboratoriais, de imagem, etc. (hemograma, glicemia, raio-x, etc.)
   - "receita": Prescrições médicas com medicamentos
   - "vacinacao": Cartões ou certificados de vacinação
   - "consulta": Relatórios ou resumos de consultas médicas
   - "outro": Atestados, declarações, etc.

6. **extracted_values**: Array de TODOS os valores numéricos encontrados (OBRIGATÓRIO para exames):
   - Formato: {"parameter": "Nome do Parâmetro", "value": 14.5, "unit": "g/dL", "reference_range": "12-16"}
   - Extraia TODOS os parâmetros do exame com seus valores, unidades e faixas de referência
   - Para exames de sangue, sempre haverá múltiplos valores

7. **medications**: Array de medicamentos (OBRIGATÓRIO para receitas):
   - Formato: {"name": "Nome do Medicamento", "dosage": "500mg", "frequency": "1 vez ao dia", "duration": "10 dias"}
   - Extraia TODOS os medicamentos prescritos com dosagem e frequência
   - Inclua instruções de uso se presentes

REGRAS CRÍTICAS:
- Leia TODO o documento antes de responder
- NÃO confunda tipos de documentos (exame ≠ atestado ≠ receita)
- Seja PRECISO com datas - verifique o contexto ("coleta", "emissão", "validade")
- SEMPRE procure o nome do laboratório no cabeçalho/rodapé
- Para exames laboratoriais, extracted_values NUNCA deve estar vazio

Retorne APENAS um objeto JSON válido, sem markdown ou texto adicional.

Exemplo de exame laboratorial:
{
  "title": "Hemograma Completo",
  "issued_at": "2024-01-15",
  "expires_at": null,
  "provider": "Laboratório Sabin",
  "category": "exame",
  "extracted_values": [
    {"parameter": "Hemoglobina", "value": 14.5, "unit": "g/dL", "reference_range": "12-16"},
    {"parameter": "Leucócitos", "value": 7500, "unit": "/mm³", "reference_range": "4000-11000"},
    {"parameter": "Plaquetas", "value": 250000, "unit": "/mm³", "reference_range": "150000-400000"}
  ]
}

Exemplo de receita médica:
{
  "title": "Receita Médica",
  "issued_at": "2024-01-15",
  "expires_at": "2024-04-15",
  "provider": "Dr. João Silva - CRM 12345",
  "category": "receita",
  "medications": [
    {"name": "Amoxicilina 500mg", "dosage": "500mg", "frequency": "8 em 8 horas", "duration": "7 dias"},
    {"name": "Paracetamol 750mg", "dosage": "750mg", "frequency": "Se necessário", "duration": "Enquanto houver dor"}
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Analise este documento de saúde COM ATENÇÃO e extraia TODAS as informações com PRECISÃO. Leia o documento TODO antes de responder:" 
              },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API Error:", errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content || "";
    console.log("Raw content:", content);
    
    // Parse JSON from response, handling markdown code blocks
    let extractedInfo;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to find JSON object in the content
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }
      
      extractedInfo = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!extractedInfo.title) {
        console.warn("Missing title in extracted data");
        extractedInfo.title = "Documento de Saúde";
      }
      if (!extractedInfo.category) {
        console.warn("Missing category in extracted data");
        extractedInfo.category = "outro";
      }
      if (!extractedInfo.extracted_values) {
        extractedInfo.extracted_values = [];
      }
      
      console.log("Successfully extracted:", JSON.stringify(extractedInfo, null, 2));
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      console.error("Parse error:", e);
      throw new Error("Failed to parse document information from AI response");
    }

    // Calculate confidence score based on filled fields
    const totalFields = 8; // title, issued_at, expires_at, provider, category, extracted_values, medications, ocr_text
    let filledFields = 0;
    if (extractedInfo.title && extractedInfo.title.trim().length > 0) filledFields++;
    if (extractedInfo.issued_at) filledFields++;
    if (extractedInfo.expires_at) filledFields++;
    if (extractedInfo.provider) filledFields++;
    if (extractedInfo.category) filledFields++;
    if (extractedInfo.extracted_values && extractedInfo.extracted_values.length > 0) filledFields++;
    if (extractedInfo.medications && extractedInfo.medications.length > 0) filledFields++;
    if (extractedInfo.ocr_text && extractedInfo.ocr_text.length > 10) filledFields++;
    
    const confidence = filledFields / totalFields;
    const status = confidence >= 0.7 ? 'pending_review' : 'failed';

    console.log(`Extraction confidence: ${confidence.toFixed(2)} (${filledFields}/${totalFields} fields)`);

    // Save to cache
    try {
      await supabase
        .from("extraction_cache")
        .insert({
          user_id: user.id,
          image_hash: imageHash,
          extraction_type: "document",
          extracted_data: { ...extractedInfo, confidence, status }
        });
      console.log("Extraction saved to cache");
    } catch (cacheInsertError) {
      console.error("Failed to save to cache:", cacheInsertError);
      // Don't fail the request if cache save fails
    }

    return new Response(
      JSON.stringify({ ...extractedInfo, confidence, status, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in extract-document:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process document" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
