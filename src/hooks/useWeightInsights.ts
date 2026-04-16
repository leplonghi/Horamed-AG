import { useQuery } from "@tanstack/react-query";
import { fetchCollection, where, orderBy } from "@/integrations/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays, subDays, format } from "date-fns";
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

// GLP-1 and weight-related medications
const GLP1_MEDICATIONS = [
  'ozempic', 'wegovy', 'mounjaro', 'saxenda', 'victoza', 
  'trulicity', 'byetta', 'bydureon', 'rybelsus', 'semaglutida',
  'liraglutida', 'tirzepatida', 'dulaglutida', 'exenatida'
];

const BARIATRIC_MEDICATIONS = [
  'orlistat', 'xenical', 'contrave', 'qsymia', 'saxenda',
  'sibutramina', 'lorcaserin', 'phentermine', 'topiramato'
];

export interface WeightInsight {
  type: 'observation' | 'correlation' | 'trend' | 'frequency' | 'info';
  title: string;
  description: string;
  value?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface WeightData {
  weightKg: number;
  recordedAt: string;
}

export interface MedicationMarker {
  id: string;
  name: string;
  startDate: string;
  category: string;
  type: 'medication' | 'supplement';
}

interface MedicationData {
  id: string;
  name: string;
  createdAt: string;
  category: string | null;
  treatmentStartDate: string | null;
}

export function useWeightInsights(profileId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["weight-insights", user?.id, profileId],
    queryFn: async () => {
      const userId = user.uid;

      // Fetch weight logs
      const weightPath = profileId 
        ? `users/${userId}/profiles/${profileId}/weight_logs`
        : `users/${userId}/weight_logs`;
      
      const { data: weightLogs } = await fetchCollection<WeightData>(weightPath, [
        orderBy("recordedAt", "asc")
      ]);

      // Fetch ALL active medications for timeline markers
      const medsPath = profileId
        ? `users/${userId}/profiles/${profileId}/medications`
        : `users/${userId}/medications`;

      const { data: allMedications } = await fetchCollection<MedicationData>(medsPath, [
        where("isActive", "==", true)
      ]);

      // Create medication markers for timeline
      const medicationMarkers: MedicationMarker[] = (allMedications || []).map((med: MedicationData) => ({
        id: med.id,
        name: med.name,
        startDate: med.treatmentStartDate || med.createdAt,
        category: med.category || 'medication',
        type: med.category === 'supplement' ? 'supplement' : 'medication'
      }));

      // Detect GLP-1 or bariatric medications
      const glp1Meds = (allMedications || []).filter((med: MedicationData) => 
        GLP1_MEDICATIONS.some(glp => med.name.toLowerCase().includes(glp))
      );

      const bariatricMeds = (allMedications || []).filter((med: MedicationData) => 
        BARIATRIC_MEDICATIONS.some(bar => med.name.toLowerCase().includes(bar))
      );

      const weightRelatedMeds = [...glp1Meds, ...bariatricMeds];
      const hasGLP1 = weightRelatedMeds.length > 0;

      // Generate insights with NEUTRAL, non-judgmental tone
      const insights: WeightInsight[] = [];

      if (!weightLogs || weightLogs.length === 0) {
        return { 
          insights: [{
            type: 'info' as const,
            title: 'Acompanhamento de peso',
            description: 'Registre seu peso para visualizar tendências ao longo do tempo.',
          }], 
          hasGLP1, 
          medications: weightRelatedMeds,
          medicationMarkers,
          latestWeight: null,
          totalChange: null,
          daysSinceFirst: null,
          daysSinceLastLog: null
        };
      }

      const weights = weightLogs as WeightData[];
      const latestWeight = weights[weights.length - 1];
      const firstWeight = weights[0];

      // Calculate total change
      const totalChange = latestWeight.weightKg - firstWeight.weightKg;
      const daysSinceFirst = differenceInDays(
        safeDateParse(latestWeight.recordedAt),
        safeDateParse(firstWeight.recordedAt)
      );

      const lastLogDate = safeDateParse(latestWeight.recordedAt);
      const daysSinceLastLog = differenceInDays(new Date(), lastLogDate);

      // NEUTRAL 7-day trend observation
      const sevenDaysAgo = subDays(new Date(), 7);
      const recentWeights = weights.filter(w => safeDateParse(w.recordedAt) >= sevenDaysAgo);
      
      if (recentWeights.length >= 2) {
        const weekChange = recentWeights[recentWeights.length - 1].weightKg - recentWeights[0].weightKg;
        
        if (Math.abs(weekChange) < 0.3) {
          insights.push({
            type: 'trend',
            title: 'Peso estável',
            description: 'Seu peso está estável nas últimas semanas.',
            value: `${latestWeight.weightKg} kg`,
            trend: 'stable'
          });
        } else {
          insights.push({
            type: 'trend',
            title: 'Variação observada',
            description: `Houve uma variação de ${Math.abs(weekChange).toFixed(1)} kg em relação ao período anterior.`,
            value: `${weekChange > 0 ? '+' : ''}${weekChange.toFixed(1)} kg`,
            trend: weekChange > 0 ? 'up' : 'down'
          });
        }
      } else if (weights.length < 3) {
        insights.push({
          type: 'info',
          title: 'Poucos registros',
          description: 'Ainda não há dados suficientes para análise de tendência.',
        });
      }

      // NEUTRAL medication correlation (if applicable)
      if (hasGLP1 && weightRelatedMeds[0]) {
        const medStartDate = safeDateParse(weightRelatedMeds[0].treatmentStartDate || weightRelatedMeds[0].createdAt);
        const weightsAfterMed = weights.filter(w => 
          safeDateParse(w.recordedAt) >= medStartDate
        );

        if (weightsAfterMed.length >= 2) {
          const weightAtMedStart = weightsAfterMed[0];
          const changeWithMed = latestWeight.weightKg - weightAtMedStart.weightKg;
          const daysSinceMed = differenceInDays(new Date(), medStartDate);

          insights.push({
            type: 'correlation',
            title: 'Correlação com tratamento',
            description: `Desde o início do acompanhamento com ${weightRelatedMeds[0].name} (${daysSinceMed} dias), variação de ${Math.abs(changeWithMed).toFixed(1)} kg.`,
            value: `${changeWithMed > 0 ? '+' : ''}${changeWithMed.toFixed(1)} kg`,
            trend: changeWithMed > 0 ? 'up' : changeWithMed < 0 ? 'down' : 'stable'
          });
        }
      }

      // Frequency guidance (weekly is ideal)
      if (daysSinceLastLog > 10) {
        insights.push({
          type: 'frequency',
          title: 'Registro semanal recomendado',
          description: 'Para acompanhar tendências, o ideal é registrar o peso uma vez por semana.',
        });
      }

      // Long-term observation (neutral, no celebration)
      if (daysSinceFirst > 30 && weights.length >= 4) {
        insights.push({
          type: 'observation',
          title: 'Histórico de acompanhamento',
          description: `${weights.length} registros em ${daysSinceFirst} dias. Variação total: ${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)} kg.`,
          value: `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)} kg`,
          trend: totalChange > 0 ? 'up' : totalChange < 0 ? 'down' : 'stable'
        });
      }

      return { 
        insights, 
        hasGLP1, 
        medications: weightRelatedMeds,
        medicationMarkers,
        latestWeight: latestWeight.weightKg,
        totalChange,
        daysSinceFirst,
        daysSinceLastLog
      };
    },
    enabled: !!user?.uid,
  });
}
