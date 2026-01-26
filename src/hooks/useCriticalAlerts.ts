import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type AlertSeverity = "critical" | "urgent" | "warning";

export interface CriticalAlert {
  id: string;
  type: "duplicate_dose" | "zero_stock" | "missed_essential" | "drug_interaction";
  severity: AlertSeverity;
  title: string;
  message: string;
  itemId?: string;
  itemName?: string;
}

const DISMISSED_ALERTS_KEY = "horamed_dismissed_alerts";
const ALERT_EXPIRY_HOURS = 24;
const CACHE_KEY = "critical-alerts";

const getDismissedAlerts = (): Record<string, number> => {
  try {
    const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
    if (!stored) return {};
    const dismissed = JSON.parse(stored);
    
    const now = Date.now();
    const filtered: Record<string, number> = {};
    Object.entries(dismissed).forEach(([id, timestamp]) => {
      const hoursSince = (now - (timestamp as number)) / (1000 * 60 * 60);
      if (hoursSince < ALERT_EXPIRY_HOURS) {
        filtered[id] = timestamp as number;
      }
    });
    
    return filtered;
  } catch {
    return {};
  }
};

const saveDismissedAlert = (alertId: string) => {
  try {
    const dismissed = getDismissedAlerts();
    dismissed[alertId] = Date.now();
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(dismissed));
  } catch (error) {
    console.error("Error saving dismissed alert:", error);
  }
};

async function fetchCriticalAlerts(): Promise<CriticalAlert[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const newAlerts: CriticalAlert[] = [];
  const fourHoursAgo = new Date();
  fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

  // Batch all queries together
  const [profileRes, itemsRes, missedDosesRes, recentDosesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("birth_date, weight_kg, height_cm")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("items")
      .select("id, name, is_active, stock(units_left)")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("dose_instances")
      .select("id, due_at, item_id, items!inner(name, user_id, category)")
      .eq("items.user_id", user.id)
      .eq("status", "scheduled")
      .lt("due_at", new Date().toISOString())
      .gte("due_at", fourHoursAgo.toISOString()),
    supabase
      .from("dose_instances")
      .select("id, item_id, taken_at, items!inner(name, user_id)")
      .eq("items.user_id", user.id)
      .eq("status", "taken")
      .gte("taken_at", fourHoursAgo.toISOString())
  ]);

  const profile = profileRes.data;
  const items = itemsRes.data;
  const missedDoses = missedDosesRes.data;
  const recentDoses = recentDosesRes.data;

  // Calculate age/BMI
  let age: number | null = null;
  if (profile?.birth_date) {
    const birthDate = new Date(profile.birth_date);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear() - 
      (today.getMonth() < birthDate.getMonth() || 
       (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
  }

  // Check for zero stock
  items?.forEach((item: any) => {
    if (item.stock?.[0] && item.stock[0].units_left === 0) {
      newAlerts.push({
        id: `stock_${item.id}`,
        type: "zero_stock",
        severity: "critical",
        title: "Estoque zerado",
        message: `${item.name} está sem estoque.`,
        itemId: item.id,
        itemName: item.name,
      });
    }
  });

  // Check for missed critical doses
  missedDoses?.forEach((dose: any) => {
    if (dose.items.category === "medicamento") {
      const hoursMissed = Math.floor(
        (new Date().getTime() - new Date(dose.due_at).getTime()) / (1000 * 60 * 60)
      );

      let severity: AlertSeverity = hoursMissed >= 2 ? "critical" : "urgent";
      let message = `${dose.items.name} está ${hoursMissed}h atrasado.`;
      
      if (age && age >= 65 && hoursMissed >= 2) {
        severity = "critical";
        message = `⚠️ ${dose.items.name} está ${hoursMissed}h atrasado. Tome imediatamente.`;
      }

      newAlerts.push({
        id: `missed_${dose.id}`,
        type: "missed_essential",
        severity,
        title: age && age >= 65 ? "Dose crítica atrasada (Idoso)" : "Dose atrasada",
        message,
        itemId: dose.item_id,
        itemName: dose.items.name,
      });
    }
  });

  // Check for duplicate doses
  const dosesByItem = new Map<string, any[]>();
  recentDoses?.forEach((dose: any) => {
    if (!dosesByItem.has(dose.item_id)) {
      dosesByItem.set(dose.item_id, []);
    }
    dosesByItem.get(dose.item_id)?.push(dose);
  });

  dosesByItem.forEach((doses, itemId) => {
    if (doses.length >= 2) {
      const lastDose = doses[doses.length - 1];
      const secondLastDose = doses[doses.length - 2];
      
      const timeDiff = Math.abs(
        new Date(lastDose.taken_at).getTime() - 
        new Date(secondLastDose.taken_at).getTime()
      ) / (1000 * 60 * 60);

      if (timeDiff < 4) {
        newAlerts.push({
          id: `duplicate_${itemId}`,
          type: "duplicate_dose",
          severity: "warning",
          title: "Possível dose duplicada",
          message: `Você registrou ${lastDose.items.name} há menos de 4 horas.`,
          itemId,
          itemName: lastDose.items.name,
        });
      }
    }
  });

  // Filter dismissed alerts
  const dismissed = getDismissedAlerts();
  return newAlerts.filter(alert => !dismissed[alert.id]);
}

export function useCriticalAlerts() {
  const queryClient = useQueryClient();
  const lastRefreshRef = useRef<number>(0);

  const { data: alerts = [], isLoading: loading } = useQuery({
    queryKey: [CACHE_KEY],
    queryFn: fetchCriticalAlerts,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 60 * 1000, // Check every minute
  });

  const refresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current < 5000) return;
    lastRefreshRef.current = now;
    queryClient.invalidateQueries({ queryKey: [CACHE_KEY] });
  }, [queryClient]);

  const dismissAlert = useCallback((alertId: string) => {
    saveDismissedAlert(alertId);
    queryClient.setQueryData([CACHE_KEY], (old: CriticalAlert[] | undefined) => 
      old?.filter(a => a.id !== alertId) ?? []
    );
  }, [queryClient]);

  const dismissAll = useCallback(() => {
    alerts.forEach(alert => saveDismissedAlert(alert.id));
    queryClient.setQueryData([CACHE_KEY], []);
  }, [alerts, queryClient]);

  return {
    alerts,
    loading,
    refresh,
    dismissAlert,
    dismissAll,
  };
}