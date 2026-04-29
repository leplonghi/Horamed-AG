import { useState, useCallback, useEffect, useRef } from "react";
import { format, startOfDay, endOfDay, addDays, subDays } from "date-fns";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useProfileCacheContext } from "@/contexts/ProfileCacheContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { symptomService } from "@/lib/symptomService";
import {
  fetchCollection,
  fetchDocument,
  where,
  orderBy,
  limit,
} from "@/integrations/firebase";
import { Dose } from "@/types/dose";
import { Profile } from "@/types/profile";
import { safeParseDoseDate } from "@/types";
import { safeDateParse } from "@/lib/safeDateUtils";
import { eventBus, AppEvents } from "@/domain/services/EventBus";
import { MedicalEvent } from "@/types/medicalEvents";

export interface TimelineItem {
  id: string;
  time: string;
  type: "medication" | "appointment" | "exam" | "procedure" | "other" | "vitamin" | "supplement";
  category?: string;
  title: string;
  subtitle?: string;
  status: "pending" | "done" | "missed";
  onMarkDone?: () => void;
  onSnooze?: () => void;
  itemId?: string;
  location?: string;
  doctor?: string;
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const safeDate = (value: unknown): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value && typeof value === "object" && ("dueAt" in value || "due_at" in value)) {
    const parsed = safeParseDoseDate(value as Dose);
    return parsed || new Date();
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = safeDateParse(value as string);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
};

// â”€â”€ Hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useTodayData(
  selectedDate: Date,
  onMarkDone: (doseId: string, itemId: string, itemName: string) => void,
  onSnooze: (doseId: string, itemName: string) => void
) {
  const { user: authUser } = useAuth();
  const { activeProfile } = useUserProfiles();
  const { getProfileCache } = useProfileCacheContext();
  const { t } = useLanguage();

  // â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [todayStats, setTodayStats] = useState({ total: 0, taken: 0 });
  const [nextPendingDose, setNextPendingDose] = useState<Dose | null>(null);
  const [nextDayDose, setNextDayDose] = useState<{ time: string; name: string } | null>(null);
  const [hasMedications, setHasMedications] = useState(true);
  const [hasLoggedSymptomsToday, setHasLoggedSymptomsToday] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<string[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [claraInsight, setClaraInsight] = useState<string>("");

  // Stable refs so callbacks in timeline items always call the latest version
  const onMarkDoneRef = useRef(onMarkDone);
  const onSnoozeRef = useRef(onSnooze);
  useEffect(() => {
    onMarkDoneRef.current = onMarkDone;
    onSnoozeRef.current = onSnooze;
  });

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const getUserPaths = useCallback(
    (userId: string) => {
      const profileId = activeProfile?.id;
      const base = profileId
        ? `users/${userId}/profiles/${profileId}`
        : `users/${userId}`;
      return {
        // Doses are stored in the global dose_instances collection, not per-user subcollection
        doses: "dose_instances",
        appointments: `${base}/appointments`,
        events: `${base}/healthEvents`,
      };
    },
    [activeProfile?.id]
  );

  // â”€â”€ Load tomorrow's first dose â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const loadTomorrowFirstDose = useCallback(async () => {
    if (!authUser) return;
    try {
      const tomorrow = addDays(new Date(), 1);
      const paths = getUserPaths(authUser.uid);
      const { data } = await fetchCollection<Dose>(paths.doses, [
        where("dueAt", ">=", startOfDay(tomorrow).toISOString()),
        where("dueAt", "<=", endOfDay(tomorrow).toISOString()),
        where("status", "==", "scheduled"),
        orderBy("dueAt", "asc"),
        limit(1),
      ]);
      if (data && data.length > 0) {
        setNextDayDose({
          time: format(safeDate(data[0].dueAt), "HH:mm"),
          name: data[0].itemName || "",
        });
      } else {
        setNextDayDose(null);
      }
    } catch {
      // non-critical â€” swallow silently
    }
  }, [authUser, getUserPaths]);

  // â”€â”€ Main data loader â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const loadData = useCallback(
    async (date: Date, forceLoading = false) => {
      if (!authUser) {
        setLoading(false);
        return;
      }

      const userId = authUser.uid;
      const profileId = activeProfile?.id;
      const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

      // Apply profile cache for instant paint on profile switch
      if (profileId && isToday) {
        const cached = getProfileCache(profileId);
        if (cached) {
          const cachedDoses = (cached.todayDoses || []) as unknown as Dose[];
          setTimelineItems(
            cachedDoses.map((dose) => ({
              id: dose.id,
              time: format(safeDate(dose.dueAt || dose.due_at), "HH:mm"),
              type: dose.items?.category === "vitamina" ? "vitamin" : 
                    dose.items?.category === "suplemento" ? "supplement" : "medication",
              category: dose.items?.category,
              title: dose.itemName || medNamesMap.get(dose.itemId || dose.item_id || "") || "Medicamento",
              subtitle: dose.doseText || "",
              status:
                dose.status === "taken" ? "done" : dose.status === "missed" ? "missed" : "pending",
              itemId: dose.item_id || dose.itemId,
            }))
          );
          setTodayStats({
            total: cachedDoses.length,
            taken: cachedDoses.filter((d) => d.status === "taken").length,
          });
          if (!forceLoading) setLoading(false);
        }
      }

      if (forceLoading) setLoading(true);

      const paths = getUserPaths(userId);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      try {
        const weekStart = startOfDay(subDays(date, 3));
        const weekEnd = endOfDay(addDays(date, 3));

        // â”€â”€ Main Data Fetching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // We use a Promise.race with a timeout to avoid hanging indefinitely
        const TIMEOUT_MS = 6000;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Firebase request timeout")), TIMEOUT_MS)
        );

        // Build constraints for dose_instances (global collection with userId filter)
        // Fetch ALL doses for the user in the date range, then filter by profileId client-side
        // This avoids Firestore null-comparison issues and handles backward compatibility
        const doseDayConstraints: any[] = [
          where("userId", "==", userId),
          where("dueAt", ">=", dayStart.toISOString()),
          where("dueAt", "<=", dayEnd.toISOString()),
          orderBy("dueAt", "asc"),
        ];

        const doseWeekConstraints: any[] = [
          where("userId", "==", userId),
          where("dueAt", ">=", weekStart.toISOString()),
          where("dueAt", "<=", weekEnd.toISOString()),
        ];

        const fetchPromises: Promise<any>[] = [
          profileId
            ? fetchDocument<Profile>(`users/${userId}/profiles`, profileId)
            : fetchDocument<{ nickname?: string; fullName?: string }>(`users`, userId),
          fetchCollection<Dose>(paths.doses, doseDayConstraints),
          fetchCollection<MedicalEvent>(paths.appointments, [
            where("date", ">=", dayStart),
            where("date", "<=", dayEnd),
            orderBy("date", "asc"),
          ]),
          fetchCollection<MedicalEvent>(paths.events, [
            where("date", ">=", dayStart),
            where("date", "<=", dayEnd),
            orderBy("date", "asc"),
          ]),
          fetchCollection<Dose>(paths.doses, doseWeekConstraints),
        ];

        const fetchAll = Promise.all(fetchPromises);

        const results = await Promise.race([fetchAll, timeoutPromise]) as any[];

        const nameResult = results[0];
        const nd = nameResult?.data as { nickname?: string; fullName?: string; name?: string } | null;
        if (nd) setUserName(nd.nickname || nd.fullName || nd.name || "");

        // Filter doses by profileId client-side
        // If profileId is set: show doses for that profile OR doses without profileId (backward compat)
        // If no profileId: show all doses
        let allDoses: Dose[] = results[1]?.data || [];
        let allWeekDoses: Dose[] = results[4]?.data || [];

        let doses: Dose[] = allDoses;
        let weekDoses: Dose[] = allWeekDoses;

        if (profileId) {
          doses = allDoses.filter(d => d.profileId === profileId || !d.profileId);
          weekDoses = allWeekDoses.filter(d => d.profileId === profileId || !d.profileId);
        }

        const appointments = results[2]?.data || [];
        const events = results[3]?.data || [];

        // Fetch medication names for doses that don't have itemName embedded
        const itemIds = doses.filter(d => !d.itemName && d.itemId).map(d => d.itemId);
        let medNamesMap = new Map<string, string>();
        if (itemIds.length > 0) {
          try {
            const { data: meds } = await fetchCollection(`users/${userId}/medications`, []);
            if (meds) {
              meds.forEach((m: any) => {
                if (m.id && m.name) medNamesMap.set(m.id, m.name);
              });
            }
          } catch { /* non-critical */ }
        }

        // 4. Calculate event counts for the calendar dots
        const counts: Record<string, number> = {};
        weekDoses.forEach(d => {
          const dDate = format(safeDate(d.dueAt || d.due_at), "yyyy-MM-dd");
          counts[dDate] = (counts[dDate] || 0) + 1;
        });
        setEventCounts(counts);

        // 3. Build unified timeline
        const items: TimelineItem[] = [
          ...doses.map((dose) => ({
            id: dose.id,
            time: format(safeDate(dose.dueAt || dose.due_at), "HH:mm"),
            type: dose.items?.category === "vitamina" ? ("vitamin" as const) : 
                  dose.items?.category === "suplemento" ? ("supplement" as const) : ("medication" as const),
            category: dose.items?.category || undefined,
            title: dose.itemName || medNamesMap.get(dose.itemId || dose.item_id || "") || "Medicamento",
            subtitle: dose.doseText || "",
            status:
              dose.status === "taken" ? ("done" as const) : dose.status === "missed" ? ("missed" as const) : ("pending" as const),
            itemId: dose.item_id || dose.itemId,
            onMarkDone: () =>
              onMarkDoneRef.current(
                dose.id,
                dose.item_id || dose.itemId || "",
                dose.itemName || medNamesMap.get(dose.itemId || dose.item_id || "") || "Medicamento"
              ),
            onSnooze: () =>
              onSnoozeRef.current(dose.id, dose.itemName || medNamesMap.get(dose.itemId || dose.item_id || "") || "Medicamento"),
          })),
          ...appointments.map((apt) => ({
            id: apt.id,
            time: apt.time || format(safeDate(apt.date), "HH:mm"),
            type: "appointment" as const,
            title: apt.title || apt.doctor?.specialty || t("todayRedesign.appointmentDefault"),
            subtitle: apt.doctor?.name
              ? t("todayRedesign.doctorPrefix", { name: apt.doctor.name })
              : apt.location?.name,
            status: (apt.status === "completed" || apt.status === "done") ? ("done" as const) : ("pending" as const),
            location: apt.location?.name,
            doctor: apt.doctor?.name,
          })),
          ...events.map((ev) => ({
            id: ev.id,
            time: ev.time || "09:00",
            type: (ev.type === "exam" ? "exam" : ev.type === "procedure" ? "procedure" : "other") as any,
            title: ev.title,
            subtitle: ev.location?.name || ev.doctor?.name,
            status: (ev.status === "completed" || ev.status === "done") ? ("done" as const) : ("pending" as const),
            location: ev.location?.name,
            doctor: ev.doctor?.name,
          })),
        ].sort((a, b) => a.time.localeCompare(b.time));

        setTimelineItems(items);

        // â”€â”€ Generative Clara Insight â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        let insight = "";
        const patientName = nd?.nickname || nd?.fullName || "vocÃª";
        
        const supplementsCount = doses.filter(d => d.items?.category === 'suplemento' || d.items?.category === 'vitamina').length;
        const isWellnessFocused = supplementsCount > doses.length / 2;

        if (doses.length > 0) {
          const taken = doses.filter(d => d.status === 'taken').length;
          
          if (taken === doses.length) {
            insight = isWellnessFocused 
              ? `IncrÃ­vel, ${patientName}! Meta de bem-estar batida. VocÃª estÃ¡ no caminho certo!`
              : `ParabÃ©ns, ${patientName}! VocÃª completou toda a sua rotina de hoje.`;
          } else if (taken > 0) {
            insight = isWellnessFocused
              ? `Foco total! VocÃª jÃ¡ completou ${taken} etapas da sua rotina de performance hoje.`
              : `Continue assim! VocÃª jÃ¡ tomou ${taken} de ${doses.length} doses hoje.`;
          } else {
            insight = isWellnessFocused
              ? `Bom dia, ${patientName}! Hoje Ã© dia de potencializar sua saÃºde. Tem ${doses.length} itens na lista!`
              : `Bom dia, ${patientName}! VocÃª tem ${doses.length} doses planejadas para hoje.`;
          }
        } else if (items.length > 0) {
          insight = `${patientName}, vocÃª tem ${items.length} compromissos de saÃºde hoje.`;
        } else {
          insight = "Dia tranquilo! Nenhuma medicaÃ§Ã£o ou compromisso agendado.";
        }

        // Contextual awareness
        const exams = events.filter(e => e.type === 'exam');
        if (exams.length > 0) {
          insight += " Lembre-se de conferir se algum exame exige jejum.";
        }

        setClaraInsight(insight);

        // 4. Stats + next dose
        if (isToday && doses.length > 0) {
          setTodayStats({
            total: doses.length,
            taken: doses.filter((d) => d.status === "taken").length,
          });
          const pending = doses
            .filter((d) => d.status === "scheduled" || d.status === "pending")
            .sort((a, b) => safeDate(a.dueAt || a.due_at).getTime() - safeDate(b.dueAt || b.due_at).getTime());

          if (pending.length > 0) {
            setNextPendingDose(pending[0]);
            setNextDayDose(null);
          } else {
            setNextPendingDose(null);
            void loadTomorrowFirstDose();
          }
        }

        // 5. New-user detection
        if (doses.length === 0) {
          try {
            const constraints = profileId ? [where("profileId", "==", profileId)] : [];
            const { data: meds } = await fetchCollection(`users/${userId}/medications`, constraints);
            setHasMedications((meds ?? []).length > 0);
          } catch {
            setHasMedications(true);
          }
        } else {
          setHasMedications(true);
        }

        // 6. Symptom log check (today only)
        if (isToday) {
          try {
            const logs = await symptomService.getLogsByDateRange(userId, dayStart, dayEnd);
            setHasLoggedSymptomsToday(logs.length > 0);
          } catch {
            // non-critical
          }
        }
      } catch (error) {
        console.error("useTodayData: loadData error", error);
        toast.error(t("todayRedesign.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [authUser, activeProfile?.id, t, getProfileCache, getUserPaths, loadTomorrowFirstDose]
  );

  // â”€â”€ Event counts (calendar dots) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const loadEventCounts = useCallback(async () => {
    if (!authUser) return;
    try {
      const monthStart = startOfDay(
        safeDateParse(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      );
      const monthEnd = endOfDay(
        safeDateParse(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
      );
      const paths = getUserPaths(authUser.uid);

      const [dosesResult, appointmentsResult, eventsResult] = await Promise.all([
        fetchCollection<Dose>(paths.doses, [
          where("dueAt", ">=", monthStart.toISOString()),
          where("dueAt", "<=", monthEnd.toISOString()),
        ]),
        fetchCollection<Appointment>(paths.appointments, [
          where("date", ">=", monthStart),
          where("date", "<=", monthEnd),
        ]),
        fetchCollection<HealthEvent>(paths.events, [
          where("type", "==", "renovacao_exame"),
          where("dueDate", ">=", format(monthStart, "yyyy-MM-dd")),
          where("dueDate", "<=", format(monthEnd, "yyyy-MM-dd")),
        ]),
      ]);

      const counts: Record<string, number> = {};
      dosesResult.data?.forEach((d) => {
        const key = format(safeDate(d.dueAt || d.due_at), "yyyy-MM-dd");
        counts[key] = (counts[key] || 0) + 1;
      });
      appointmentsResult.data?.forEach((a) => {
        const key = format(safeDate(a.date), "yyyy-MM-dd");
        counts[key] = (counts[key] || 0) + 1;
      });
      eventsResult.data?.forEach((e) => {
        counts[e.dueDate] = (counts[e.dueDate] || 0) + 1;
      });
      setEventCounts(counts);
    } catch {
      // non-critical
    }
  }, [authUser, selectedDate, getUserPaths]);

  // â”€â”€ Low stock (for Clara) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const loadLowStock = useCallback(async () => {
    if (!authUser) return;
    try {
      const { data } = await fetchCollection<StockItem>(`users/${authUser.uid}/stock`, []);
      if (data) {
        setLowStockItems(
          data
            .filter((s) => s.currentQty <= (s.alertThreshold ?? 5))
            .map((s) => s.itemName)
            .filter(Boolean)
        );
      }
    } catch {
      // non-critical
    }
  }, [authUser]);

  // â”€â”€ Effects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // Stable ref to always call latest loadData without stale closure in eventBus listener
  const latestLoadRef = useRef(() => loadData(selectedDate));
  const latestLoadDataRef = useRef(loadData);
  const latestLoadEventCountsRef = useRef(loadEventCounts);

  useEffect(() => {
    latestLoadRef.current = () => loadData(selectedDate);
    latestLoadDataRef.current = loadData;
    latestLoadEventCountsRef.current = loadEventCounts;
  });

  // Initial + date/profile change load
  useEffect(() => {
    // Initial data load - only blocks 'loading' for today's essential data
    void latestLoadDataRef.current(selectedDate, true);
  }, [selectedDate, activeProfile?.id]);

  // Low stock on mount
  useEffect(() => {
    void loadLowStock();
  }, [loadLowStock]);

  // Reactive to local dose events (DOSE_TAKEN / DOSE_SNOOZED / etc)
  useEffect(() => {
    const unsub1 = eventBus.on(AppEvents.DOSE_TAKEN, () => latestLoadRef.current());
    const unsub2 = eventBus.on(AppEvents.DOSE_SNOOZED, () => latestLoadRef.current());
    const unsub3 = eventBus.on(AppEvents.DOSE_SKIPPED, () => latestLoadRef.current());
    const unsub4 = eventBus.on(AppEvents.DOSE_MISSED, () => latestLoadRef.current());
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, []);

  const optimisticMarkDone = useCallback((doseId: string) => {
    setTimelineItems((prev) =>
      prev.map((item) =>
        item.id === doseId ? { ...item, status: "done" } : item
      )
    );
    setTodayStats((prev) => ({
      ...prev,
      taken: Math.min(prev.taken + 1, prev.total),
    }));
  }, []);

  return {
    loading,
    userName,
    timelineItems,
    todayStats,
    nextPendingDose,
    nextDayDose,
    hasMedications,
    hasLoggedSymptomsToday,
    setHasLoggedSymptomsToday,
    lowStockItems,
    eventCounts,
    claraInsight,
    reload: () => latestLoadRef.current(),
    optimisticMarkDone,
  };
}


