import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMPT = `Analise este documento de saúde e extraia em JSON:

CAMPOS OBRIGATÓRIOS:
- title: Nome do documento
- category: "exame"|"receita"|"vacinacao"|"consulta"|"outro"
- issued_at: Data (YYYY-MM-DD)
- expires_at: Validade (YYYY-MM-DD) ou null
- provider: Instituição
- confidence_score: 0-1

ESPECÍFICOS POR TIPO:
exame: extracted_values: [{"parameter":"Nome","value":14.5,"unit":"g/dL","reference_range":"12-16","status":"normal|high|low"}]
receita: prescriptions: [{"drug_name":"Med","dose":"500mg","frequency":"8/8h","duration_days":7}], doctor_name, doctor_registration
vacinacao: vaccine_name, dose_number, application_date, next_dose_date, vaccination_location, batch_number
consulta: doctor_name, specialty, diagnosis, notes, followup_date

Retorne apenas JSON válido.`;

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

    const processedImage = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    console.log("Sending to AI...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia as informações deste documento:" },
              { type: "image_url", image_url: { url: processedImage } },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("AI Error:", response.status);
      return new Response(
        JSON.stringify({ error: "Erro ao processar imagem" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("No JSON in response");
    }
    
    const extractedInfo = JSON.parse(jsonMatch[0]);
    
    // Defaults
    if (!extractedInfo.title) extractedInfo.title = "Documento de Saúde";
    if (!extractedInfo.category) extractedInfo.category = "outro";
    if (!extractedInfo.confidence_score) extractedInfo.confidence_score = 0.5;
    if (!extractedInfo.extracted_values) extractedInfo.extracted_values = [];
    if (!extractedInfo.prescriptions) extractedInfo.prescriptions = [];

    return new Response(
      JSON.stringify(extractedInfo),
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
