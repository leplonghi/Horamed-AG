import { useCallback, useMemo } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { differenceInMinutes } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { functions } from "@/integrations/firebase/client";
import { httpsCallable } from "firebase/functions";
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

interface MedicationItem {
  id: string;
  name: string;
  doseText?: string | null;
  profileId?: string;
  profileName?: string;
}

interface OverdueDose {
  id: string;
  dueAt: Date;
  itemId: string;
  itemName: string;
  doseText: string | null;
  minutesOverdue: number;
  profileName: string;
}

const CACHE_KEY = "overdue-doses";

export const useOverdueDoses = () => {
  const { activeProfile } = useUserProfiles();
  const queryClient = useQueryClient();

  const profileId = activeProfile?.id;

  const { data: overdueDoses = [], isLoading: loading } = useQuery({
    queryKey: [CACHE_KEY, profileId],
    queryFn: async (): Promise<OverdueDose[]> => {
      const user = auth.currentUser;
      if (!user) return [];

      const now = new Date();
      const twoHoursAgo = safeDateParse(now.getTime() - 2 * 60 * 60 * 1000);
      const nowIso = now.toISOString();
      const twoHoursAgoIso = twoHoursAgo.toISOString();

      // Fetch Items (Medications)
      const itemsRef = collection(db, 'users', user.uid, 'medications');
      let itemsQuery = query(itemsRef);

      if (profileId) {
        itemsQuery = query(itemsRef, where("profileId", "==", profileId));
      }

      const itemsSnap = await getDocs(itemsQuery);
      if (itemsSnap.empty) return [];

      const items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as MedicationItem[];
      const itemIds = items.map(i => i.id);
      const itemsMap = new Map(items.map(i => [i.id, i]));

      // Fetch Doses from dose_instances (global collection)
      const dosesRef = collection(db, 'dose_instances');
      const dosesQuery = query(
        dosesRef,
        where("userId", "==", user.uid),
        where("status", "==", "scheduled"),
        where("dueAt", "<", now),
        where("dueAt", ">=", twoHoursAgo)
      );

      const dosesSnap = await getDocs(dosesQuery);

      // Filter by items and map
      const doses = dosesSnap.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            dueAt: data.dueAt,
            itemId: data.itemId || data.item_id,
            status: data.status
          };
        })
        .filter(d => itemsMap.has(d.itemId)); // Only include doses for relevant items (profile filter)

      // Sort - with safe date parsing
      doses.sort((a, b) => {
        const dateA = a.dueAt ? safeDateParse(a.dueAt) : new Date();
        const dateB = b.dueAt ? safeDateParse(b.dueAt) : new Date();
        return (isNaN(dateA.getTime()) ? 0 : dateA.getTime()) - (isNaN(dateB.getTime()) ? 0 : dateB.getTime());
      });

      return doses.map((dose) => {
        const item = itemsMap.get(dose.itemId);

        // Safe date parsing - prevent crashes
        let dueAt: Date;
        try {
          if (!dose.dueAt) {
            dueAt = new Date();
          } else {
            const parsed = safeDateParse(dose.dueAt);
            dueAt = isNaN(parsed.getTime()) ? new Date() : parsed;
          }
        } catch {
          dueAt = new Date();
        }

        return {
          id: dose.id,
          dueAt,
          itemId: dose.itemId,
          itemName: item?.name || "Medicamento",
          doseText: item?.doseText || null,
          minutesOverdue: differenceInMinutes(now, dueAt),
          profileName: item?.profileName || "Paciente",
        };
      });
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 3 * 60 * 1000,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [CACHE_KEY, profileId] });
  }, [queryClient, profileId]);

  const markAsTaken = useCallback(async (doseId: string) => {
    try {
      // Optimistic update
      queryClient.setQueryData([CACHE_KEY, profileId], (old: OverdueDose[] | undefined) =>
        old?.filter(d => d.id !== doseId) ?? []
      );

      const handleDoseAction = httpsCallable(functions, 'handleDoseAction');
      await handleDoseAction({ doseId, action: 'taken' });

    } catch (error) {
      refresh(); // Revert on error
    }
  }, [queryClient, profileId, refresh]);

  const hasOverdue = useMemo(() => overdueDoses.length > 0, [overdueDoses.length]);

  return {
    overdueDoses,
    loading,
    refresh,
    markAsTaken,
    hasOverdue,
  };
};