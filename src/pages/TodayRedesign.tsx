import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { auth, fetchCollection, fetchDocument, updateDocument, where, orderBy, query, limit, serverTimestamp } from "@/integrations/firebase";
import { onSnapshot, collection, doc, query as firestoreQuery } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, addDays } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

import Header from "@/components/Header";
import { useMedicationAlarm } from "@/hooks/useMedicationAlarm";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { useMilestoneDetector } from "@/hooks/useMilestoneDetector";
import { useCriticalAlerts } from "@/hooks/useCriticalAlerts";
import { useFeedbackToast } from "@/hooks/useFeedbackToast";
import DayTimeline from "@/components/DayTimeline";
import ModernWeekCalendar from "@/components/ModernWeekCalendar";
import { Card } from "@/components/ui/card";
import CriticalAlertBanner from "@/components/CriticalAlertBanner";
import MilestoneReward from "@/components/gamification/MilestoneReward";
import AchievementShareDialog from "@/components/gamification/AchievementShareDialog";
import { useAchievements, Achievement } from "@/hooks/useAchievements";
import { Dose, DoseStatus } from "@/types/dose";
import { Profile } from "@/types/profile";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useProfileCacheContext } from "@/contexts/ProfileCacheContext";
import { useSmartRedirect } from "@/hooks/useSmartRedirect";
import { VaccineRemindersWidget } from "@/components/VaccineRemindersWidget";
import { ExpiredPrescriptionsAlert } from "@/components/ExpiredPrescriptionsAlert";
import { trackDoseTaken } from "@/hooks/useAppMetrics";
import { OverdueDosesBanner } from "@/components/OverdueDosesBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import StockAlertWidget from "@/components/StockAlertWidget";
import MonthlyReportWidget from "@/components/MonthlyReportWidget";
import HeroNextDose from "@/components/HeroNextDose";
import ClaraProactiveCard from "@/components/ClaraProactiveCard";
import { useOverdueDoses } from "@/hooks/useOverdueDoses";
import DrugInteractionAlert from "@/components/health/DrugInteractionAlert";
import OceanBackground from "@/components/ui/OceanBackground";
import SocialProofBanner from "@/components/fomo/SocialProofBanner";
import StreakRiskAlert from "@/components/fomo/StreakRiskAlert";
import PremiumBenefitsMini from "@/components/fomo/PremiumBenefitsMini";
import VitalsGlanceWidget from "@/components/VitalsGlanceWidget";
// 10/10 Polish: Import externalized components and confetti
import { TodayStatusCard } from "@/components/today/TodayStatusCard";
import { AndroidPermissionsCard } from "@/components/AndroidPermissionsCard";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";
import { Skeleton } from "@/components/ui/skeleton";
import AdminFloatingButton from "@/components/AdminFloatingButton";
import { DailyCheckInWidget } from "@/components/symptoms/DailyCheckInWidget";
import { symptomService } from "@/lib/symptomService";

interface TimelineItem {
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
  id: string; // Firestore ID usually
  itemId?: string; // Sometimes distinct or same
  itemName: string;
  currentQty: number;
  alertThreshold?: number;
}



// Helper function for safe date parsing - with fallback
import { safeParseDoseDate } from "@/types";
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

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

const safeDate = (value: unknown): Date => {
  // For backward compatibility with appointments and other non-Dose objects
  if (!value) return new Date();

  // If it's a Dose object, use the type-safe parser
  if (value && typeof value === 'object' && ('dueAt' in value || 'due_at' in value)) {
    const asDose = value as { dueAt?: unknown; due_at?: unknown };
    // Assuming safeParseDoseDate handles partial objects or unknown, but if it expects Dose explicitly, we might need a cast or check.
    // Let's assume we cast to any for the external function if it's strictly typed but we just validated presence of keys.
    // Or just cast to any here to satisfy TS inside this utility function intended to handle "any" legacy data safely.
    // "value as any" is safer than implicit any if we explain why.
    // But better: cast to unknown then appropriate type.
    const parsed = safeParseDoseDate(value as Dose);
    return parsed || new Date();
  }

  // Check if safeDateParse is available (defensive coding)
  if (typeof safeDateParse !== 'function') {
    console.error("CRITICAL: safeDateParse is not a function", value);
    try {
      const d = new Date(value as string | number | Date); // Cast for constructor
      return isNaN(d.getTime()) ? new Date() : d;
    } catch {
      return new Date();
    }
  }

  // For other date values (appointments, etc)
  if (value instanceof Date) return value;

  // Check for Firestore Timestamp-like object (toDate method)
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  // Fallback for string/number
  if (typeof value === 'string' || typeof value === 'number') {
    const d = safeDateParse(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  return new Date();
};



export default function TodayRedesign() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const {
    scheduleNotificationsForNextDay
  } = useMedicationAlarm();
  usePushNotifications();
  const { currentStreak, refresh: refreshStreak } = useStreakCalculator();
  const {
    milestone,
    isNewMilestone,
    markAsSeen
  } = useMilestoneDetector();
  const {
    achievements
  } = useAchievements();
  const { alerts, refresh: refreshAlerts, dismissAlert, dismissAll } = useCriticalAlerts();
  const {
    showFeedback
  } = useFeedbackToast();
  const {
    activeProfile
  } = useUserProfiles();
  const { getProfileCache } = useProfileCacheContext();
  const { t, language } = useLanguage();
  useSmartRedirect();
  const { overdueDoses } = useOverdueDoses();
  const { width, height } = useWindowSize(); // Window size for confetti
  const [showConfetti, setShowConfetti] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [todayStats, setTodayStats] = useState({
    total: 0,
    taken: 0,
  });
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [showMilestoneReward, setShowMilestoneReward] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [nextPendingDose, setNextPendingDose] = useState<Dose | null>(null);
  const [nextDayDose, setNextDayDose] = useState<{ time: string; name: string } | null>(null);
  const [hasLoggedSymptomsToday, setHasLoggedSymptomsToday] = useState(false);
  const [hasMedications, setHasMedications] = useState(true); // default true → avoids flash on load
  // Milestone detection
  useEffect(() => {
    if (isNewMilestone && milestone) {
      setShowMilestoneReward(true);
    }
  }, [isNewMilestone, milestone]);

  // Load low stock items for Clara - memoized
  const loadLowStock = useCallback(async () => {
    try {
      const user = authUser;
      if (!user) return;

      const { data: stockData } = await fetchCollection<StockItem>(
        `users/${user.uid}/stock`,
        []
      );

      if (stockData) {
        const lowItems = stockData
          .filter((s) => s.currentQty <= (s.alertThreshold || 5))
          .map((s) => s.itemName)
          .filter(Boolean);
        setLowStockItems(lowItems);
      }
    } catch (error) {
      console.error("Error loading low stock:", error);
    }
  }, [authUser]);

  useEffect(() => {
    loadLowStock();
  }, [loadLowStock]);

  // Handle Clara action clicks
  const handleClaraAction = useCallback((action: string) => {
    if (action === "overdue") {
      // Scroll to overdue banner or open first overdue dose
      const banner = document.getElementById("overdue-banner");
      banner?.scrollIntoView({ behavior: "smooth" });
    } else if (action.startsWith("/")) {
      navigate(action);
    }
  }, [navigate]);

  const openClara = useCallback(() => {
    window.dispatchEvent(new CustomEvent('openClara'));
  }, []);
  const handleMilestoneClose = () => {
    setShowMilestoneReward(false);
    markAsSeen();
  };
  const handleMilestoneShare = () => {
    setShowMilestoneReward(false);
    markAsSeen();
    const milestoneAchievements: Record<number, string> = {
      7: "week_streak",
      30: "month_streak",
      90: "quarter_streak"
    };
    const achievementId = milestone ? milestoneAchievements[milestone] : null;
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement) {
      setSelectedAchievement(achievement);
      setShareDialogOpen(true);
    }
  };
  const loadEventCounts = useCallback(async () => {
    try {
      const user = authUser;
      if (!user) return;
      const monthStart = startOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      const monthEnd = endOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));

      const userId = user.uid;
      const profileId = activeProfile?.id;

      const dosesPath = profileId ? `users/${userId}/profiles/${profileId}/doses` : `users/${userId}/doses`;
      const appointmentsPath = profileId ? `users/${userId}/profiles/${profileId}/appointments` : `users/${userId}/appointments`;
      const eventsPath = profileId ? `users/${userId}/profiles/${profileId}/healthEvents` : `users/${userId}/healthEvents`;

      const [dosesResult, appointmentsResult, eventsResult] = await Promise.all([
        fetchCollection<Dose>(dosesPath, [
          where("dueAt", ">=", monthStart.toISOString()),
          where("dueAt", "<=", monthEnd.toISOString())
        ]),
        fetchCollection<Appointment>(appointmentsPath, [
          where("date", ">=", monthStart.toISOString()),
          where("date", "<=", monthEnd.toISOString())
        ]),
        fetchCollection<HealthEvent>(eventsPath, [
          where("type", "==", "renovacao_exame"),
          where("dueDate", ">=", format(monthStart, "yyyy-MM-dd")),
          where("dueDate", "<=", format(monthEnd, "yyyy-MM-dd"))
        ])
      ]);

      const counts: Record<string, number> = {};
      dosesResult.data?.forEach((dose) => {
        const key = format(safeDate(dose.dueAt || dose.due_at), "yyyy-MM-dd");
        counts[key] = (counts[key] || 0) + 1;
      });
      appointmentsResult.data?.forEach((apt) => {
        const key = format(safeDate(apt.date), "yyyy-MM-dd");
        counts[key] = (counts[key] || 0) + 1;
      });
      eventsResult.data?.forEach((event) => {
        const key = event.dueDate;
        counts[key] = (counts[key] || 0) + 1;
      });
      setEventCounts(counts);
    } catch (error) {
      console.error("Error loading event counts:", error);
    }
  }, [selectedDate, activeProfile?.id, authUser]);

  const loadTomorrowFirstDose = useCallback(async () => {
    try {
      const user = authUser;
      if (!user) return;

      const tomorrow = addDays(new Date(), 1);
      const tomorrowStart = startOfDay(tomorrow);
      const tomorrowEnd = endOfDay(tomorrow);

      const userId = user.uid;
      const profileId = activeProfile?.id;

      const dosesPath = profileId ? `users/${userId}/profiles/${profileId}/doses` : `users/${userId}/doses`;

      const { data: tomorrowDoses } = await fetchCollection<Dose>(dosesPath, [
        where("dueAt", ">=", tomorrowStart.toISOString()),
        where("dueAt", "<=", tomorrowEnd.toISOString()),
        where("status", "==", "scheduled"),
        orderBy("dueAt", "asc"),
        limit(1)
      ]);

      if (tomorrowDoses && tomorrowDoses.length > 0) {
        const dose = tomorrowDoses[0];
        setNextDayDose({
          time: format(safeDate(dose.dueAt), "HH:mm"),
          name: dose.itemName || ""
        });
      } else {
        setNextDayDose(null);
      }
    } catch (error) {
      console.error("Error loading tomorrow doses:", error);
    }
  }, [activeProfile?.id, authUser]);

  // Memoized callbacks para evitar re-render do HeroNextDose
  const markAsTaken = useCallback(async (doseId: string, itemId: string, itemName: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userId = user.uid;
      const stockRef = `users/${userId}/stock`;

      const { data: stockData } = await fetchDocument<StockItem>(stockRef, itemId);

      if (stockData && stockData.currentQty === 0) {
        toast.error(t('todayRedesign.stockEmpty'));
        return;
      }

      // Update dose status
      const dosePath = activeProfile?.id
        ? `users/${userId}/profiles/${activeProfile.id}/doses`
        : `users/${userId}/doses`;

      await updateDocument(dosePath, doseId, {
        status: "taken",
        takenAt: serverTimestamp()
      });

      // Update stock if needed
      if (stockData && stockData.currentQty > 0) {
        await updateDocument(stockRef, itemId, {
          currentQty: stockData.currentQty - 1
        });
      }

      // Track metric
      trackDoseTaken(doseId, itemName);

      showFeedback("dose-taken", {
        medicationName: itemName
      });

      // Trigger confetti for positive reinforcement
      setShowConfetti(true);

      // Use latestLoadRef to avoid stale selectedDate closure
      latestLoadRef.current();
      refreshStreak();
      refreshAlerts();
    } catch (error) {
      console.error("Error marking dose:", error);
      toast.error(t('todayRedesign.confirmDoseError'));
      throw error;
    }
  }, [t, showFeedback, refreshStreak, refreshAlerts, activeProfile?.id]);

  const snoozeDose = useCallback(async (doseId: string, itemName: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userId = user.uid;
      const dosePath = activeProfile?.id
        ? `users/${userId}/profiles/${activeProfile.id}/doses`
        : `users/${userId}/doses`;

      const { data: dose } = await fetchDocument<Dose>(dosePath, doseId);

      if (dose) {
        const newDueAt = safeDateParse(dose.dueAt);
        newDueAt.setMinutes(newDueAt.getMinutes() + 15);

        await updateDocument(dosePath, doseId, {
          dueAt: newDueAt.toISOString()
        });

        toast.success(t('todayRedesign.snoozeSuccess', { name: itemName }));
        latestLoadRef.current();
      }
    } catch (error) {
      console.error("Error snoozing dose:", error);
      toast.error(t('todayRedesign.snoozeError'));
    }
  }, [t, activeProfile?.id]);

  const loadData = useCallback(async (date: Date, forceLoading = false) => {
    try {
      const user = authUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const userId = user.uid;
      const profileId = activeProfile?.id;

      // Evita "ghost" na troca de perfil: aplica cache do perfil (apenas hoje)
      const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      if (profileId && isToday) {
        const cached = getProfileCache(profileId);
        if (cached) {
          // Cache found, apply it
          const cachedDoses = (cached.todayDoses || []) as unknown as Dose[];
          const cachedItems: TimelineItem[] = cachedDoses.map((dose) => ({
            id: dose.id,
            time: format(safeDate(dose.dueAt || dose.due_at), "HH:mm"),
            type: "medication",
            title: dose.itemName || dose.items?.name || "",
            subtitle: dose.doseText || dose.items?.dose_text || undefined,
            status:
              dose.status === "taken"
                ? "done"
                : dose.status === "missed"
                  ? "missed"
                  : "pending",
            itemId: dose.item_id || dose.itemId, // item_id from Dose, itemId from legacy
          }));

          setTimelineItems(cachedItems);
          setTodayStats({
            total: cachedDoses.length,
            taken: cachedDoses.filter((d) => d.status === "taken").length,
          });

          if (!forceLoading) {
            setLoading(false);
          }
        }
      }

      if (forceLoading) setLoading(true);

      // Load user/profile name
      let profileData: { nickname?: string; fullName?: string; name?: string } | null = null;
      if (profileId) {
        const result = await fetchDocument<Profile>(`users/${userId}/profiles`, profileId as string);
        profileData = result.data as unknown as { nickname?: string; fullName?: string; name?: string }; // Unify types
      } else {
        const result = await fetchDocument<{ nickname?: string; fullName?: string }>(`users`, userId);
        profileData = result.data;
      }

      if (profileData) {
        setUserName(profileData.nickname || profileData.fullName || profileData.name || "");
      }

      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      // Paths
      const dosesPath = profileId ? `users/${userId}/profiles/${profileId}/doses` : `users/${userId}/doses`;
      const appointmentsPath = profileId ? `users/${userId}/profiles/${profileId}/appointments` : `users/${userId}/appointments`;
      const eventsPath = profileId ? `users/${userId}/profiles/${profileId}/healthEvents` : `users/${userId}/healthEvents`;

      const [dosesResult, appointmentsResult, eventsResult] = await Promise.all([
        fetchCollection<Dose>(dosesPath, [
          where("dueAt", ">=", dayStart.toISOString()),
          where("dueAt", "<=", dayEnd.toISOString()),
          orderBy("dueAt", "asc")
        ]),
        fetchCollection<Appointment>(appointmentsPath, [
          where("date", ">=", dayStart.toISOString()),
          where("date", "<=", dayEnd.toISOString()),
          orderBy("date", "asc")
        ]),
        fetchCollection<HealthEvent>(eventsPath, [
          where("type", "==", "renovacao_exame"),
          where("dueDate", ">=", format(dayStart, "yyyy-MM-dd")),
          where("dueDate", "<=", format(dayEnd, "yyyy-MM-dd")),
          orderBy("dueDate", "asc")
        ])
      ]);

      const doses = dosesResult.data || [];
      const appointments = appointmentsResult.data || [];
      const events = eventsResult.data || [];
      const items: TimelineItem[] = [];

      doses.forEach((dose) => {
        items.push({
          id: dose.id,
          time: format(safeDate(dose.dueAt || dose.due_at), "HH:mm"),
          type: "medication",
          title: dose.itemName || dose.items?.name || "",
          subtitle: dose.doseText || dose.items?.dose_text || undefined,
          status: dose.status === "taken" ? "done" : dose.status === "missed" ? "missed" : "pending",
          itemId: dose.item_id || dose.itemId, // item_id from Dose, itemId from legacy
          onMarkDone: () => markAsTakenRef.current(dose.id, dose.item_id || dose.itemId, dose.itemName || dose.items?.name || ""),
          onSnooze: () => snoozeDoseRef.current(dose.id, dose.itemName || dose.items?.name || "")
        });
      });

      appointments.forEach((apt) => {
        items.push({
          id: apt.id,
          time: format(safeDate(apt.date), "HH:mm"),
          type: "appointment",
          title: apt.specialty || t('todayRedesign.appointmentDefault'),
          subtitle: apt.doctorName ? t('todayRedesign.doctorPrefix', { name: apt.doctorName }) : apt.location,
          status: apt.status === "done" ? "done" : "pending"
        });
      });

      events.forEach((event) => {
        items.push({
          id: event.id,
          time: "09:00",
          type: "exam",
          title: event.title,
          subtitle: event.notes || undefined,
          status: event.completedAt ? "done" : "pending"
        });
      });

      items.sort((a, b) => a.time.localeCompare(b.time));
      setTimelineItems(items);

      const isToday2 = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      if (isToday2 && doses.length > 0) {
        const total = doses.length;
        const taken = doses.filter((d) => d.status === "taken").length;
        setTodayStats({ total, taken });

        // Find next pending dose for Hero widget
        const pendingDoses = doses
          .filter((d) => d.status === "scheduled" || d.status === "pending")
          .sort((a, b) => safeDate(a.dueAt || a.due_at).getTime() - safeDate(b.dueAt || b.due_at).getTime());

        if (pendingDoses.length > 0) {
          setNextPendingDose(pendingDoses[0]);
          setNextDayDose(null);
        } else {
          setNextPendingDose(null);
          // All done for today - fetch tomorrow's first dose
          loadTomorrowFirstDose();
        }
      }

      // If no doses today, check if user has ANY medications at all (new user detection)
      if (doses.length === 0) {
        try {
          const medConstraints = []; // Check for ANY medication to detect returning users
          if (activeProfile?.id) {
            medConstraints.push(where("profileId", "==", activeProfile.id));
          }
          const { data: userMeds } = await fetchCollection(`users/${userId}/medications`, medConstraints);
          setHasMedications((userMeds ?? []).length > 0);
        } catch {
          setHasMedications(true); // assume true on error
        }
      } else {
        setHasMedications(true);
      }

      // Check for daily symptom log
      if (isToday2 && user) {
        try {
          const logs = await symptomService.getLogsByDateRange(userId, dayStart, dayEnd);
          setHasLoggedSymptomsToday(logs.length > 0);
        } catch (e) {
          console.error("Failed to fetch symptom logs", e);
        }
      }

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t("todayRedesign.loadError"));
    } finally {
      setLoading(false);
    }
  }, [activeProfile?.id, t, getProfileCache, loadTomorrowFirstDose, authUser]); // markAsTaken/snoozeDose removed — accessed via stable refs (markAsTakenRef/snoozeDoseRef)

  // Load greeting/quote once on mount or when key dependencies change
  useEffect(() => {
    const hour = new Date().getHours();
    let quotes: string[] = [];

    // Determine whether this is the user's own profile or a family profile
    const isSelf = !activeProfile || activeProfile.relationship === 'self';
    const profileName = activeProfile?.name || userName || (language === 'pt' ? "você" : "you");

    if (hour < 12) {
      setGreeting(t('today.goodMorning'));
      if (isSelf) {
        quotes = [
          t('today.quote.morning1'),
          t('today.quote.morning2'),
          t('today.quote.morning3')
        ];
      } else {
        quotes = [
          t('today.quote.other.morning1', { profileName }),
          t('today.quote.other.morning2', { profileName })
        ];
      }
    } else if (hour < 18) {
      setGreeting(t('today.goodAfternoon'));
      if (isSelf) {
        quotes = [
          t('today.quote.afternoon1'),
          t('today.quote.afternoon2'),
          t('today.quote.afternoon3')
        ];
      } else {
        quotes = [
          t('today.quote.other.afternoon1', { profileName }),
          t('today.quote.other.afternoon2', { profileName })
        ];
      }
    } else {
      setGreeting(t('today.goodEvening'));
      if (isSelf) {
        quotes = [
          t('today.quote.night1'),
          t('today.quote.night2'),
          t('today.quote.night3')
        ];
      } else {
        quotes = [
          t('today.quote.other.night1', { profileName }),
          t('today.quote.other.night2', { profileName })
        ];
      }
    }

    // Greeting set
  }, [activeProfile, userName, language, t]);

  // Load data when date or profile changes
  // IMPORTANT: loadData/loadEventCounts are NOT in deps (they change every render).
  // We use stable refs to always call the latest version without triggering loops.
  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        latestLoadDataRef.current(selectedDate, true),
        latestLoadEventCountsRef.current()
      ]);
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, activeProfile?.id]);


  // Agendar notificações apenas uma vez
  useEffect(() => {
    scheduleNotificationsForNextDay();
  }, [scheduleNotificationsForNextDay]);

  // Single shared debounce ref — used by all 3 onSnapshot listeners
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable refs — updated every render so callbacks always have the latest values
  // without being listed in effect dependency arrays (which would cause infinite loops)
  const latestLoadRef = useRef<() => void>(() => { });
  const latestLoadDataRef = useRef(loadData);
  const latestLoadEventCountsRef = useRef(loadEventCounts);
  const markAsTakenRef = useRef(markAsTaken);
  const snoozeDoseRef = useRef(snoozeDose);
  // No deps array — runs after every render to keep refs fresh
  useEffect(() => {
    latestLoadRef.current = () => loadData(selectedDate);
    latestLoadDataRef.current = loadData;
    latestLoadEventCountsRef.current = loadEventCounts;
    markAsTakenRef.current = markAsTaken;
    snoozeDoseRef.current = snoozeDose;
  });


  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;
    const profileId = activeProfile?.id;

    // Realtime changes using onSnapshot
    const dosesPath = profileId ? `users/${userId}/profiles/${profileId}/doses` : `users/${userId}/doses`;
    const appointmentsPath = profileId ? `users/${userId}/profiles/${profileId}/appointments` : `users/${userId}/appointments`;
    const eventsPath = profileId ? `users/${userId}/profiles/${profileId}/healthEvents` : `users/${userId}/healthEvents`;

    // All 3 listeners share one debounced reload — max 1 reload/sec total
    const handleRemoteChange = () => {
      if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
      realtimeDebounceRef.current = setTimeout(() => latestLoadRef.current(), 1000);
    };

    const qDoses = firestoreQuery(collection(db, dosesPath));
    const qApts = firestoreQuery(collection(db, appointmentsPath));
    const qEvents = firestoreQuery(collection(db, eventsPath));

    const unsubDoses = onSnapshot(qDoses, handleRemoteChange);
    const unsubApts = onSnapshot(qApts, handleRemoteChange);
    const unsubEvents = onSnapshot(qEvents, handleRemoteChange);

    return () => {
      unsubDoses();
      unsubApts();
      unsubEvents();
      if (realtimeDebounceRef.current) {
        window.clearTimeout(realtimeDebounceRef.current);
      }
    };
  }, [activeProfile?.id]);


  // Memoize allDoneToday to avoid HeroNextDose re-render
  const allDoneToday = useMemo(() =>
    todayStats.total > 0 && todayStats.taken === todayStats.total,
    [todayStats.total, todayStats.taken]
  );

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {showConfetti && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <ReactConfetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={400}
            onConfettiComplete={() => setShowConfetti(false)}
          />
        </div>
      )}
      <OceanBackground variant="page" />
      <Header />

      <main className="page-container container mx-auto max-w-2xl px-4 space-y-4 relative z-10">

        {loading ? (
          <div className="space-y-6 pt-2 animate-pulse">
            {/* Header Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-2/3 max-w-[200px]" />
              <Skeleton className="h-4 w-1/2 max-w-[150px]" />
            </div>

            {/* Hero Card Skeleton */}
            <Skeleton className="h-48 w-full rounded-3xl" />

            {/* Stats Pulse Skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>

            {/* Timeline Skeleton */}
            <div className="space-y-4 pt-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 📍 HEADER - Saudação simples e limpa */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="pt-1">
              <h1 className="text-xl font-bold text-foreground">
                {greeting}{userName ? `, ${userName}` : ''}
              </h1>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 📅 CALENDÁRIO STRIP - Estilo Horizontal (Phase 1) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <ModernWeekCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              profileId={activeProfile?.id}
            />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 🔴 BLOCO PRINCIPAL - PRÓXIMA DOSE (SEMPRE VISÍVEL NO TOPO) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <HeroNextDose
              dose={nextPendingDose}
              nextDayDose={nextDayDose}
              onTake={markAsTaken}
              onSnooze={snoozeDose}
              allDoneToday={allDoneToday}
              hasMedications={hasMedications}
            />

            {/* Garantia Absoluta de Notificações - Permissões Android (P0) */}
            <div className="mb-2 mt-2 px-1">
              <AndroidPermissionsCard hideWhenOk={true} />
            </div>

            {/* Banner de doses atrasadas */}
            <div id="overdue-banner">
              <OverdueDosesBanner />
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 📋 TIMELINE - Lista de Doses (Phase 1 Main Content) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="mt-1 mb-4 px-1">
              <DayTimeline date={selectedDate} items={timelineItems} onDateChange={setSelectedDate} />
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 🏥 DAILY CHECK-IN WIDGET */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="mb-4">
              <DailyCheckInWidget
                hasLoggedToday={hasLoggedSymptomsToday}
                onLogComplete={() => setHasLoggedSymptomsToday(true)}
              />
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 🤖 CLARA PROATIVA - Sugestões contextuais inteligentes */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <ClaraProactiveCard
              overdueDoses={overdueDoses.length}
              lowStockItems={lowStockItems}
              currentStreak={currentStreak}
              todayProgress={todayStats}
              onOpenClara={openClara}
              onActionClick={handleClaraAction}
            />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 📊 STATUS DO DIA - Memoizado */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <TodayStatusCard
              streak={currentStreak}
              taken={todayStats.taken}
              total={todayStats.total}
              language={language}
            />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 🏥 VITAL SIGNS GLANCE (Quick Stats) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <VitalsGlanceWidget profileId={activeProfile?.id} />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ⚠️ ALERTAS (Compactos, não competem com ação principal) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {alerts.length > 0 && (
              <CriticalAlertBanner
                alerts={alerts}
                onDismiss={(id) => dismissAlert(id)}
                onDismissAll={() => dismissAll()}
              />
            )}

            <StockAlertWidget />

            {/* Drug Interaction Alert */}
            <DrugInteractionAlert />





            {/* Widgets secundários */}
            <ExpiredPrescriptionsAlert />
            <VaccineRemindersWidget />
            <MonthlyReportWidget />

            {/* 🎯 FOMO - Streak risk alert */}
            <StreakRiskAlert
              currentStreak={currentStreak}
              hasPendingDoses={todayStats.total > todayStats.taken}
            />

            {/* 🎯 FOMO - Premium benefits teaser */}
            <PremiumBenefitsMini variant="vertical" />

            {/* Milestone Reward Modal */}
            {milestone && (
              <MilestoneReward
                visible={showMilestoneReward}
                onClose={handleMilestoneClose}
                onShare={handleMilestoneShare}
                milestone={milestone}
              />
            )}

            {/* Achievement Share Dialog */}
            {selectedAchievement && (
              <AchievementShareDialog
                achievement={selectedAchievement}
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
              />
            )}
          </>
        )}
      </main>

      <AdminFloatingButton />
    </div>
  );
}