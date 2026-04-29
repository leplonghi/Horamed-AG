import { useCallback, useMemo } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { differenceInMinutes } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
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

      // Debug logging
      console.log('[useOverdueDoses] Fetching overdue doses:', {
        now: nowIso,
        twoHoursAgo: twoHoursAgoIso,
        profileId: profileId || 'none'
      });

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
        where("dueAt", "<", nowIso),
        where("dueAt", ">=", twoHoursAgoIso)
      );

      const dosesSnap = await getDocs(dosesQuery);

      console.log('[useOverdueDoses] Found doses:', dosesSnap.docs.length);

      // Filter by items and map
      const doses = dosesSnap.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            dueAt: data.dueAt,
            itemId: data.itemId || data.item_id,
            status: data.status,
            itemName: data.itemName
          };
        })
        .filter(d => itemsMap.has(d.itemId)); // Only include doses for relevant items (profile filter)
      
      console.log('[useOverdueDoses] After profile filter:', doses.length);

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
    // Optimistic update first
    queryClient.setQueryData([CACHE_KEY, profileId], (old: OverdueDose[] | undefined) =>
      old?.filter(d => d.id !== doseId) ?? []
    );
    try {
      await updateDoc(doc(db, 'dose_instances', doseId), {
        status: 'taken',
        takenAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('[useOverdueDoses] Error marking dose as taken:', error);
      refresh(); // Revert optimistic update on error
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