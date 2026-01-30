import { useQuery } from "@tanstack/react-query";
import { auth, fetchCollection, where, orderBy, fetchDocument } from "@/integrations/firebase";
import { differenceInDays, subDays } from "date-fns";

export interface StockProjection {
  id: string;
  itemId: string;
  itemName: string;
  currentQty: number;
  unitsTotal: number;
  projectedEndAt: string | null;
  createdFromPrescriptionId: string | null;
  prescriptionTitle: string | null;
  lastRefillAt: string | null;
  consumptionHistory: ConsumptionEntry[];
  dailyConsumptionAvg: number;
  daysRemaining: number | null;
  consumptionTrend: 'increasing' | 'stable' | 'decreasing';
  takenCount7d: number;
  scheduledCount7d: number;
  adherence7d: number;
  unitLabel?: string;
}

export interface ConsumptionEntry {
  date: string;
  amount: number;
  reason: 'taken' | 'adjusted' | 'refill' | 'lost';
}

export function useStockProjection(profileId?: string) {
  return useQuery({
    queryKey: ["stock-projection", profileId],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      // Fetch all active medications for user
      const { data: medications } = await fetchCollection<any>(
        `users/${user.uid}/medications`,
        [where('isActive', '==', true)]
      );

      if (!medications || medications.length === 0) return [];

      let filteredMeds = medications;
      if (profileId) {
        filteredMeds = medications.filter(m => m.profileId === profileId);
      }

      if (filteredMeds.length === 0) return [];

      const itemIds = filteredMeds.map(m => m.id);

      // Fetch stock for these items
      const { data: stockRecords } = await fetchCollection<any>(
        `users/${user.uid}/stock`,
        [where('itemId', 'in', itemIds)]
      );

      if (!stockRecords || stockRecords.length === 0) return [];

      // Fetch doses for adherence calculations
      const sevenDaysAgo = subDays(new Date(), 7);
      const { data: doses } = await fetchCollection<any>(
        `users/${user.uid}/doses`,
        [
          where('dueAt', '>=', sevenDaysAgo.toISOString()),
          where('itemId', 'in', itemIds)
        ]
      );

      // Process and project
      const projections: StockProjection[] = await Promise.all(stockRecords.map(async (s: any) => {
        const item = filteredMeds.find(m => m.id === s.itemId);
        if (!item) return null;

        const itemDoses = doses?.filter(d => d.itemId === item.id) || [];
        const takenDoses = itemDoses.filter(d => d.status === 'taken');
        const scheduledDoses = itemDoses.filter(d =>
          d.status === 'scheduled' || d.status === 'taken'
        );

        const dailyConsumptionAvg = takenDoses.length / 7;
        const adherence = scheduledDoses.length > 0
          ? (takenDoses.length / scheduledDoses.length) * 100
          : 0;

        // Calculate consumption trend
        const firstHalf = takenDoses.filter(d =>
          new Date(d.takenAt || d.dueAt) <= subDays(new Date(), 3.5)
        ).length;
        const secondHalf = takenDoses.filter(d =>
          new Date(d.takenAt || d.dueAt) > subDays(new Date(), 3.5)
        ).length;

        let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
        if (secondHalf > firstHalf * 1.2) trend = 'increasing';
        if (secondHalf < firstHalf * 0.8) trend = 'decreasing';

        const daysRemaining = s.projectedEndAt
          ? differenceInDays(new Date(s.projectedEndAt), new Date())
          : dailyConsumptionAvg > 0
            ? Math.round(s.currentQty / dailyConsumptionAvg)
            : null;

        // Optionally fetch prescription title if we have an ID
        let prescriptionTitle = null;
        if (s.createdFromPrescriptionId) {
          const { data: healthDoc } = await fetchDocument<any>(
            `users/${user.uid}/healthDocuments`,
            s.createdFromPrescriptionId
          );
          prescriptionTitle = healthDoc?.title || null;
        }

        return {
          id: s.id,
          itemId: item.id,
          itemName: item.name,
          currentQty: s.currentQty,
          unitsTotal: s.unitsTotal,
          projectedEndAt: s.projectedEndAt,
          createdFromPrescriptionId: s.createdFromPrescriptionId,
          prescriptionTitle,
          lastRefillAt: s.lastRefillAt,
          consumptionHistory: s.consumptionHistory || [],
          dailyConsumptionAvg,
          daysRemaining,
          consumptionTrend: trend,
          takenCount7d: takenDoses.length,
          scheduledCount7d: scheduledDoses.length,
          adherence7d: Math.round(adherence),
          unitLabel: s.unitLabel || 'un',
        };
      }));

      const finalProjections = projections.filter(p => p !== null) as StockProjection[];

      return finalProjections.sort((a, b) => {
        if (a.daysRemaining === null) return 1;
        if (b.daysRemaining === null) return -1;
        return a.daysRemaining - b.daysRemaining;
      });
    },
    enabled: true,
  });
}
