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

// ── Local types ──────────────────────────────────────────────────────────────

export interface TimelineItem {
  id: string;
  time: string;
  type: "medication" | "appointment" | "exam";
  title: string;
  subtitle?: string;
  status: "pending" | "done" | "missed";
  onMarkDone?: () => void;
  onSnooze?: () => void;
  itemId?: string;
}

interface StockItem {
  id: string;
  itemId?: string;
  itemName: string;
  currentQty: number;
  alertThreshold?: number;
}

interface Appointment {
  id: string;
  date: string | Date | { toDate: () => Date };
  specialty?: string;
  doctorName?: string;
  location?: string;
  status: "done" | "pending" | "cancelled";
}

interface HealthEvent {
  id: string;
  type: string;
  dueDate: string;
  title: string;
  notes?: string;
  completedAt?: string | Date | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTodayData(
  selectedDate: Date,
  onMarkDone: (doseId: string, itemId: string, itemName: string) => void,
  onSnooze: (doseId: string, itemName: string) => void
) {
  const { user: authUser } = useAuth();
  const { activeProfile } = useUserProfiles();
  const { getProfileCache } = useProfileCacheContext();
  const { t } = useLanguage();

  // ── State ────────────────────────────────────────────────────────────────

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

  // Stable refs so callbacks in timeline items always call the latest version
  const onMarkDoneRef = useRef(onMarkDone);
  const onSnoozeRef = useRef(onSnooze);
  useEffect(() => {
    onMarkDoneRef.current = onMarkDone;
    onSnoozeRef.current = onSnooze;
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getUserPaths = useCallback(
    (userId: string) => {
      const profileId = activeProfile?.id;
      const base = profileId
        ? `users/${userId}/profiles/${profileId}`
        : `users/${userId}`;
      return {
        doses: `${base}/doses`,
        appointments: `${base}/appointments`,
        events: `${base}/healthEvents`,
      };
    },
    [activeProfile?.id]
  );

  // ── Load tomorrow's first dose ───────────────────────────────────────────

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
      // non-critical — swallow silently
    }
  }, [authUser, getUserPaths]);

  // ── Main data loader ─────────────────────────────────────────────────────

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
              type: "medication",
              title: dose.itemName || dose.items?.name || "",
              subtitle: dose.doseText || dose.items?.dose_text,
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

      try {
        const weekStart = startOfDay(subDays(date, 3));
        const weekEnd = endOfDay(addDays(date, 3));

        const [nameResult, dosesResult, appointmentsResult, eventsResult, weekDosesResult] = await Promise.all([
          profileId
            ? fetchDocument<Profile>(`users/${userId}/profiles`, profileId)
            : fetchDocument<{ nickname?: string; fullName?: string }>(`users`, userId),
          fetchCollection<Dose>(paths.doses, [
            where("dueAt", ">=", dayStart.toISOString()),
            where("dueAt", "<=", dayEnd.toISOString()),
            orderBy("dueAt", "asc"),
          ]),
          fetchCollection<Appointment>(paths.appointments, [
            where("date", ">=", dayStart.toISOString()),
            where("date", "<=", dayEnd.toISOString()),
            orderBy("date", "asc"),
          ]),
          fetchCollection<HealthEvent>(paths.events, [
            where("type", "==", "renovacao_exame"),
            where("dueDate", ">=", format(dayStart, "yyyy-MM-dd")),
            where("dueDate", "<=", format(dayEnd, "yyyy-MM-dd")),
            orderBy("dueDate", "asc"),
          ]),
          fetchCollection<Dose>(paths.doses, [
            where("dueAt", ">=", weekStart.toISOString()),
            where("dueAt", "<=", weekEnd.toISOString()),
          ]),
        ]);

        const nd = nameResult.data as { nickname?: string; fullName?: string; name?: string } | null;
        if (nd) setUserName(nd.nickname || nd.fullName || nd.name || "");

        const doses = dosesResult.data || [];
        const appointments = appointmentsResult.data || [];
        const events = eventsResult.data || [];

        // 4. Calculate event counts for the calendar dots
        const counts: Record<string, number> = {};
        (weekDosesResult.data || []).forEach(d => {
          const dDate = format(safeDate(d.dueAt || d.due_at), "yyyy-MM-dd");
          counts[dDate] = (counts[dDate] || 0) + 1;
        });
        setEventCounts(counts);

        // 3. Build unified timeline
        const items: TimelineItem[] = [
          ...doses.map((dose) => ({
            id: dose.id,
            time: format(safeDate(dose.dueAt || dose.due_at), "HH:mm"),
            type: "medication" as const,
            title: dose.itemName || dose.items?.name || "",
            subtitle: dose.doseText || dose.items?.dose_text,
            status:
              dose.status === "taken" ? ("done" as const) : dose.status === "missed" ? ("missed" as const) : ("pending" as const),
            itemId: dose.item_id || dose.itemId,
            onMarkDone: () =>
              onMarkDoneRef.current(
                dose.id,
                dose.item_id || dose.itemId || "",
                dose.itemName || dose.items?.name || ""
              ),
            onSnooze: () =>
              onSnoozeRef.current(dose.id, dose.itemName || dose.items?.name || ""),
          })),
          ...appointments.map((apt) => ({
            id: apt.id,
            time: format(safeDate(apt.date), "HH:mm"),
            type: "appointment" as const,
            title: apt.specialty || t("todayRedesign.appointmentDefault"),
            subtitle: apt.doctorName
              ? t("todayRedesign.doctorPrefix", { name: apt.doctorName })
              : apt.location,
            status: apt.status === "done" ? ("done" as const) : ("pending" as const),
          })),
          ...events.map((ev) => ({
            id: ev.id,
            time: "09:00",
            type: "exam" as const,
            title: ev.title,
            subtitle: ev.notes,
            status: ev.completedAt ? ("done" as const) : ("pending" as const),
          })),
        ].sort((a, b) => a.time.localeCompare(b.time));

        setTimelineItems(items);

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

  // ── Event counts (calendar dots) ─────────────────────────────────────────

  const loadEventCounts = useCallback(async () => {
    if (!authUser) return;
    try {
      const monthStart = startOfDay(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      );
      const monthEnd = endOfDay(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
      );
      const paths = getUserPaths(authUser.uid);

      const [dosesResult, appointmentsResult, eventsResult] = await Promise.all([
        fetchCollection<Dose>(paths.doses, [
          where("dueAt", ">=", monthStart.toISOString()),
          where("dueAt", "<=", monthEnd.toISOString()),
        ]),
        fetchCollection<Appointment>(paths.appointments, [
          where("date", ">=", monthStart.toISOString()),
          where("date", "<=", monthEnd.toISOString()),
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

  // ── Low stock (for Clara) ────────────────────────────────────────────────

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

  // ── Effects ──────────────────────────────────────────────────────────────

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

  // Reactive to local dose events (DOSE_TAKEN / DOSE_SNOOZED)
  useEffect(() => {
    const unsub1 = eventBus.on(AppEvents.DOSE_TAKEN, () => latestLoadRef.current());
    const unsub2 = eventBus.on(AppEvents.DOSE_SNOOZED, () => latestLoadRef.current());
    return () => {
      unsub1();
      unsub2();
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
    reload: () => latestLoadRef.current(),
    optimisticMarkDone,
  };
}
