import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

interface MedicationEntry {
  name: string;
  dosage?: string;
  frequency?: string;
}

interface PrescriptionMeta {
  medications?: MedicationEntry[];
  is_purchased?: boolean;
  isPurchased?: boolean;
}

interface SuggestionData {
  prescriptionId?: string;
  medications?: MedicationEntry[];
  items?: ItemResult[];
  prescriptions?: PrescriptionResult[];
}

interface PrescriptionResult {
  id: string;
  title?: string;
  meta?: PrescriptionMeta;
  expires_at?: string;
}

interface ItemResult {
  id: string;
  name: string;
  category?: string;
}

interface SmartSuggestion {
  type: 'prescription_to_medication' | 'medication_to_stock' | 'expired_prescription';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  data: SuggestionData;
}

export function useSmartMedicationSuggestions(profileId?: string) {
  return useQuery({
    queryKey: ["smart-medication-suggestions", profileId],
    queryFn: async () => {
      const suggestions: SmartSuggestion[] = [];

      // First, get the receita category UUID
      const { data: categoriaReceita } = await supabase
        .from("categorias_saude")
        .select("id")
        .eq("slug", "receita")
        .single();

      if (!categoriaReceita) {
        console.warn("Categoria receita not found");
        return suggestions;
      }

      // 1. Receitas com medicamentos não adicionados
      const prescriptionsQuery = supabase
        .from("documentos_saude")
        .select("id, title, meta, expires_at")
        .eq("categoria_id", (categoriaReceita as Record<string, unknown>).id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (profileId) {
        prescriptionsQuery.eq("profile_id", profileId);
      }

      const { data: rawPrescriptions } = await prescriptionsQuery;
      const prescriptions = (rawPrescriptions || []) as unknown as PrescriptionResult[];

      // Buscar medicamentos existentes
      let itemsQuery = supabase
        .from("items")
        .select("name")
        .eq("is_active", true);

      if (profileId) {
        itemsQuery = itemsQuery.eq("profile_id", profileId);
      }

      const { data: rawExistingMeds } = await itemsQuery;
      const existingMeds = (rawExistingMeds || []) as unknown as ItemResult[];
      const existingMedNames = new Set(
        existingMeds.map(m => m.name.toLowerCase().trim())
      );

      // Verificar receitas com medicamentos não adicionados
      for (const prescription of prescriptions) {
        const meta = (prescription.meta || {}) as PrescriptionMeta;
        const medications = meta.medications || [];
        const isPurchased = meta.is_purchased === true;

        const missingMeds = medications.filter((med) => {
          const medName = (med.name || '').toLowerCase().trim();
          return medName && !existingMedNames.has(medName);
        });

        if (missingMeds.length > 0 && !isPurchased) {
          const isExpired = prescription.expires_at && safeDateParse(prescription.expires_at) < new Date();

          suggestions.push({
            type: 'prescription_to_medication',
            priority: isExpired ? 'high' : 'medium',
            title: isExpired
              ? '🔴 Receita vencida não usada'
              : '💊 Adicionar remédios da receita',
            description: `${missingMeds.length} ${missingMeds.length === 1 ? 'remédio' : 'remédios'} da receita "${prescription.title || 'Sem título'}" ${isExpired ? 'vencida' : 'não foram adicionados'}`,
            actionLabel: isExpired ? 'Renovar receita' : 'Adicionar remédios',
            actionPath: `/carteira/${prescription.id}`,
            data: { prescriptionId: prescription.id, medications: missingMeds }
          });
        }
      }

      // 2. Medicamentos sem estoque configurado
      const { data: rawItemsWithoutStock } = await supabase
        .from("items")
        .select("id, name, category")
        .eq("is_active", true);

      // Filter in memory since compat layer doesn't support 'is' operator
      const itemsWithoutStock = (rawItemsWithoutStock || []) as unknown as ItemResult[];

      if (itemsWithoutStock.length > 0) {
        suggestions.push({
          type: 'medication_to_stock',
          priority: 'medium',
          title: '📦 Controle seu estoque',
          description: `${itemsWithoutStock.length} ${itemsWithoutStock.length === 1 ? 'remédio não tem' : 'remédios não têm'} controle de estoque. Evite ficar sem!`,
          actionLabel: 'Configurar estoque',
          actionPath: '/estoque',
          data: { items: itemsWithoutStock }
        });
      }

      // 3. Receitas vencidas há muito tempo (prioridade alta)
      const veryOldPrescriptions = prescriptions.filter(p => {
        if (!p.expires_at) return false;
        const meta = (p.meta || {}) as PrescriptionMeta;
        const isPurchased = meta.is_purchased === true;
        const daysExpired = Math.floor((new Date().getTime() - safeDateParse(p.expires_at).getTime()) / (1000 * 60 * 60 * 24));
        return !isPurchased && daysExpired > 30;
      });

      if (veryOldPrescriptions.length > 0) {
        suggestions.push({
          type: 'expired_prescription',
          priority: 'high',
          title: '⚠️ Receitas antigas não usadas',
          description: `${veryOldPrescriptions.length} ${veryOldPrescriptions.length === 1 ? 'receita venceu' : 'receitas venceram'} há mais de 30 dias. Peça nova receita ao médico.`,
          actionLabel: 'Ver receitas',
          actionPath: '/carteira?filtro=receita',
          data: { prescriptions: veryOldPrescriptions }
        });
      }

      // Ordenar por prioridade
      return suggestions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    },
    enabled: true,
  });
}
