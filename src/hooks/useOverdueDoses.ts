import { useCallback, useMemo } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { differenceInMinutes } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { functions } from "@/integrations/firebase/client";
import { httpsCallable } from "firebase/functions";

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
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const nowIso = now.toISOString();
      const twoHoursAgoIso = twoHoursAgo.toISOString();

      // Fetch Items (Medications)
      let itemsRef = collection(db, 'users', user.uid, 'medications');
      let itemsQuery = query(itemsRef);

      if (profileId) {
        itemsQuery = query(itemsRef, where("profileId", "==", profileId)); // CamelCase
      }

      const itemsSnap = await getDocs(itemsQuery);
      if (itemsSnap.empty) return [];

      const items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const itemIds = items.map(i => i.id);
      const itemsMap = new Map(items.map(i => [i.id, i]));

      // Fetch Doses
      const dosesRef = collection(db, 'users', user.uid, 'doses');
      const dosesQuery = query(
        dosesRef,
        where("status", "==", "scheduled"),
        where("scheduledTime", "<", nowIso),
        where("scheduledTime", ">=", twoHoursAgoIso)
        // cannot easily filter by item_id IN [...] if list is large, but Firestore 'in' has limit 10.
        // Better to filter results in memory if easy, or use 'in' chunks.
        // Since we query by User, getting all "scheduled late doses" for the user is efficient enough.
      );

      const dosesSnap = await getDocs(dosesQuery);

      // Filter by items and map
      const doses = dosesSnap.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            scheduledTime: data.scheduledTime,
            medicationId: data.medicationId,
            status: data.status
          };
        })
        .filter(d => itemsMap.has(d.medicationId)); // Only include doses for relevant items (profile filter)

      // Sort
      doses.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

      // Try to get profile name if easy, otherwise "Você"
      // Assuming med data has cached profile name or we just use "Você" if own profile.
      // Or we assume fetching profiles... 
      // For speed, let's look at item.

      return doses.map((dose) => {
        const item = itemsMap.get(dose.medicationId);
        const dueAt = new Date(dose.scheduledTime);

        return {
          id: dose.id,
          dueAt,
          itemId: dose.medicationId,
          itemName: item.name || "Medicamento",
          doseText: item.doseText,
          minutesOverdue: differenceInMinutes(now, dueAt),
          profileName: item.profileName || "Paciente", // Assume we store profileName on item or fallback
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
      console.error("Error marking dose:", error);
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