import { useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { differenceInMinutes } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      let itemsQuery = supabase.from("items").select("id, name, profile_id, user_profiles(name)");
      
      if (profileId) {
        itemsQuery = itemsQuery.eq("profile_id", profileId);
      } else {
        itemsQuery = itemsQuery.eq("user_id", user.id);
      }

      const { data: items } = await itemsQuery;
      if (!items || items.length === 0) return [];

      const itemIds = items.map(i => i.id);

      const { data: doses } = await supabase
        .from("dose_instances")
        .select("id, due_at, item_id, items(name, dose_text)")
        .in("item_id", itemIds)
        .eq("status", "scheduled")
        .lt("due_at", now.toISOString())
        .gte("due_at", twoHoursAgo.toISOString())
        .order("due_at", { ascending: true });

      if (!doses) return [];

      return doses.map((dose: any) => {
        const dueAt = new Date(dose.due_at);
        const item = items.find(i => i.id === dose.item_id);
        
        return {
          id: dose.id,
          dueAt,
          itemId: dose.item_id,
          itemName: dose.items?.name || "Medicamento",
          doseText: dose.items?.dose_text,
          minutesOverdue: differenceInMinutes(now, dueAt),
          profileName: (item?.user_profiles as any)?.name || "Você",
        };
      });
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 3 * 60 * 1000, // 3 minutes
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
      
      await supabase.functions.invoke('handle-dose-action', {
        body: { doseId, action: 'taken' }
      });
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