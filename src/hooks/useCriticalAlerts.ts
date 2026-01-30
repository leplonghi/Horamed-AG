import { useCallback, useRef } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, getDoc, doc, Timestamp, orderBy, limit } from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type AlertSeverity = "critical" | "urgent" | "warning";

export interface CriticalAlert {
  id: string;
  type: "duplicate_dose" | "zero_stock" | "missed_essential" | "drug_interaction" | "health_risk";
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
  const user = auth.currentUser;
  if (!user) return [];

  const newAlerts: CriticalAlert[] = [];
  const fourHoursAgo = new Date();
  fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);
  const fourHoursAgoIso = fourHoursAgo.toISOString();
  const nowIso = new Date().toISOString();

  // 1. Fetch Profile
  const profileRef = doc(db, 'users', user.uid, 'profile', 'me');
  const profileSnap = await getDoc(profileRef);
  const profile = profileSnap.exists() ? profileSnap.data() : null;

  // 2. Fetch Active Medications
  const medsRef = collection(db, 'users', user.uid, 'medications');
  const medsQuery = query(medsRef, where('isActive', '==', true));
  const medsSnap = await getDocs(medsQuery);
  const meds = medsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  // 3. Fetch Missed Doses
  const dosesRef = collection(db, 'users', user.uid, 'doses');
  // Firestore doesn't support inequality on different fields easily or "OR" queries easily in client SDK sometimes
  // Status = scheduled AND scheduledTime < now AND scheduledTime > 4 hours ago
  const missedDosesQuery = query(
    dosesRef,
    where('status', '==', 'scheduled'),
    where('scheduledTime', '<', nowIso),
    where('scheduledTime', '>=', fourHoursAgoIso)
  );
  const missedDosesSnap = await getDocs(missedDosesQuery);
  const missedDoses = missedDosesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  // 4. Fetch Recent Taken Doses
  const recentDosesQuery = query(
    dosesRef,
    where('status', '==', 'taken'),
    where('takenAt', '>=', fourHoursAgoIso)
  );
  const recentDosesSnap = await getDocs(recentDosesQuery);
  const recentDoses = recentDosesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];


  // --- Logic Processing ---

  // Calculate age
  let age: number | null = null;
  if (profile?.birthDate) {
    const birthDate = new Date(profile.birthDate);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear() -
      (today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
  }

  // Map items for easy lookup
  const itemsMap = new Map();
  meds.forEach(m => itemsMap.set(m.id, m));

  // Check for zero stock
  meds.forEach((item: any) => {
    // Assuming stock is stored in user/{uid}/stock/{itemId} or inside the medication doc?
    // In migrated schema, stock might be separate or embedded. 
    // Checking previous code: item.stock?.[0].units_left
    // In Firebase schema, let's assume filtering by item is tricky if stock is separate.
    // If stock is inside medication:
    if (typeof item.currentStock === 'number' && item.currentStock <= 0) {
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
  missedDoses.forEach((dose: any) => {
    const med = itemsMap.get(dose.medicationId); // Assuming medicationId links to medication
    if (med && med.category === "medicamento") {
      const hoursMissed = Math.floor(
        (new Date().getTime() - new Date(dose.scheduledTime).getTime()) / (1000 * 60 * 60)
      );

      let severity: AlertSeverity = hoursMissed >= 2 ? "critical" : "urgent";
      let message = `${med.name} está ${hoursMissed}h atrasado.`;

      if (age && age >= 65 && hoursMissed >= 2) {
        severity = "critical";
        message = `⚠️ ${med.name} está ${hoursMissed}h atrasado. Tome imediatamente.`;
      }

      newAlerts.push({
        id: `missed_${dose.id}`,
        type: "missed_essential",
        severity,
        title: age && age >= 65 ? "Dose crítica atrasada (Idoso)" : "Dose atrasada",
        message,
        itemId: med.id,
        itemName: med.name,
      });
    }
  });

  // Check for duplicate doses
  const dosesByItem = new Map<string, any[]>();
  recentDoses.forEach((dose: any) => {
    const medId = dose.medicationId;
    if (!dosesByItem.has(medId)) {
      dosesByItem.set(medId, []);
    }
    dosesByItem.get(medId)?.push(dose);
  });

  dosesByItem.forEach((doses, medId) => {
    if (doses.length >= 2) {
      // Sort by takenAt just in case
      doses.sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());

      const lastDose = doses[doses.length - 1];
      const secondLastDose = doses[doses.length - 2];

      const timeDiff = Math.abs(
        new Date(lastDose.takenAt).getTime() -
        new Date(secondLastDose.takenAt).getTime()
      ) / (1000 * 60 * 60);

      const med = itemsMap.get(medId);

      if (timeDiff < 4 && med) {
        newAlerts.push({
          id: `duplicate_${medId}`,
          type: "duplicate_dose",
          severity: "warning",
          title: "Possível dose duplicada",
          message: `Você registrou ${med.name} há menos de 4 horas.`,
          itemId: medId,
          itemName: med.name,
        });
      }
    }
  });

  // 5. Fetch Recent Pressure
  const pressureRef = collection(db, 'users', user.uid, 'pressureLogs');
  // Firestore composite index might be needed for specific ordering, but recordedAt desc is standard
  // If error occurs regarding index, we gracefully fail or catch
  try {
    const pressureQuery = query(pressureRef, orderBy('recordedAt', 'desc'), limit(1));
    const pressureSnap = await getDocs(pressureQuery);

    if (!pressureSnap.empty) {
      const lastPressure = pressureSnap.docs[0].data();
      const pDate = new Date(lastPressure.recordedAt);
      const hoursSince = (Date.now() - pDate.getTime()) / (1000 * 60 * 60);

      if (hoursSince < 24) {
        if (lastPressure.systolic >= 180 || lastPressure.diastolic >= 110) {
          newAlerts.push({
            id: `bp_critical_${lastPressure.recordedAt}`,
            type: "health_risk",
            severity: "critical",
            title: "Alerta de Pressão Crítica",
            message: `Medição de ${lastPressure.systolic}/${lastPressure.diastolic} mmHg é muito alta. Procure ajuda médica imediatamente.`,
            itemId: "bp",
            itemName: "Pressão Arterial"
          });
        } else if (lastPressure.systolic >= 140 || lastPressure.diastolic >= 90) {
          newAlerts.push({
            id: `bp_high_${lastPressure.recordedAt}`,
            type: "health_risk",
            severity: "warning",
            title: "Pressão Alta Detectada",
            message: `Sua pressão está ${lastPressure.systolic}/${lastPressure.diastolic}. Verifique se tomou seus medicamentos.`,
            itemId: "bp",
            itemName: "Pressão Arterial"
          });
        }
      }
    }
  } catch (e) {
    console.warn("Error checking pressure stats", e);
  }

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
    enabled: !!auth.currentUser, // Only run if logged in
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