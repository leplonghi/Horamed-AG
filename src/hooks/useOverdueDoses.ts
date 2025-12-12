import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { differenceInMinutes } from "date-fns";

interface OverdueDose {
  id: string;
  dueAt: Date;
  itemId: string;
  itemName: string;
  doseText: string | null;
  minutesOverdue: number;
  profileName: string;
}

export const useOverdueDoses = () => {
  const [overdueDoses, setOverdueDoses] = useState<OverdueDose[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeProfile } = useUserProfiles();

  const loadOverdueDoses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Get items for active profile or all profiles
      let itemsQuery = supabase.from("items").select("id, name, profile_id, user_profiles(name)");
      
      if (activeProfile) {
        itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      } else {
        itemsQuery = itemsQuery.eq("user_id", user.id);
      }

      const { data: items } = await itemsQuery;
      if (!items || items.length === 0) {
        setOverdueDoses([]);
        return;
      }

      const itemIds = items.map(i => i.id);

      // Get overdue doses (scheduled, past due, within 2 hours)
      const { data: doses } = await supabase
        .from("dose_instances")
        .select("id, due_at, item_id, items(name, dose_text)")
        .in("item_id", itemIds)
        .eq("status", "scheduled")
        .lt("due_at", now.toISOString())
        .gte("due_at", twoHoursAgo.toISOString())
        .order("due_at", { ascending: true });

      if (!doses) {
        setOverdueDoses([]);
        return;
      }

      const overdue: OverdueDose[] = doses.map((dose: any) => {
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

      setOverdueDoses(overdue);
    } catch (error) {
      console.error("Error loading overdue doses:", error);
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadOverdueDoses();
    
    // Refresh every minute
    const interval = setInterval(loadOverdueDoses, 60 * 1000);
    return () => clearInterval(interval);
  }, [loadOverdueDoses]);

  const markAsTaken = async (doseId: string) => {
    try {
      await supabase.functions.invoke('handle-dose-action', {
        body: { doseId, action: 'taken' }
      });
      loadOverdueDoses();
    } catch (error) {
      console.error("Error marking dose:", error);
    }
  };

  return {
    overdueDoses,
    loading,
    refresh: loadOverdueDoses,
    markAsTaken,
    hasOverdue: overdueDoses.length > 0,
  };
};
