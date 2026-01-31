import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
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
import { useAchievements } from "@/hooks/useAchievements";
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
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";
import { Skeleton } from "@/components/ui/skeleton";

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



const safeDate = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  // Handle Firestore Timestamp
  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }
  // Handle strings/numbers
  const d = new Date(value);
  // Check for Invalid Date
  if (isNaN(d.getTime())) {
    console.warn("Invalid date encountered:", value);
    return new Date(); // Fallback to current time to prevent crash
  }
  return d;
};

export default function TodayRedesign() {
  const navigate = useNavigate();
  const {
    scheduleNotificationsForNextDay
  } = useMedicationAlarm();
  usePushNotifications();
  const streakData = useStreakCalculator();
  const {
    milestone,
    isNewMilestone,
    markAsSeen
  } = useMilestoneDetector();
  const {
    achievements
  } = useAchievements();
  const criticalAlerts = useCriticalAlerts();
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
  const [reloadTrigger, setReloadTrigger] = useState(0);
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
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [nextPendingDose, setNextPendingDose] = useState<any>(null);
  const [nextDayDose, setNextDayDose] = useState<{ time: string; name: string } | null>(null);
  // Milestone detection
  useEffect(() => {
    if (isNewMilestone && milestone) {
      setShowMilestoneReward(true);
    }
  }, [isNewMilestone, milestone]);

  // Load low stock items for Clara - memoized
  const loadLowStock = useCallback(async () => {
    try {
      const user = auth.currentUser;
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
  }, []);

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
      const user = auth.currentUser;
      if (!user) return;
      const monthStart = startOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      const monthEnd = endOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));

      const userId = user.uid;
      const profileId = activeProfile?.id;

      const dosesPath = profileId ? `users/${userId}/profiles/${profileId}/doses` : `users/${userId}/doses`;
      const appointmentsPath = profileId ? `users/${userId}/profiles/${profileId}/appointments` : `users/${userId}/appointments`;
      const eventsPath = profileId ? `users/${userId}/profiles/${profileId}/healthEvents` : `users/${userId}/healthEvents`;

      const [dosesResult, appointmentsResult, eventsResult] = await Promise.all([
        fetchCollection<any>(dosesPath, [
          where("dueAt", ">=", monthStart.toISOString()),
          where("dueAt", "<=", monthEnd.toISOString())
        ]),
        fetchCollection<any>(appointmentsPath, [
          where("date", ">=", monthStart.toISOString()),
          where("date", "<=", monthEnd.toISOString())
        ]),
        fetchCollection<any>(eventsPath, [
          where("type", "==", "renovacao_exame"),
          where("dueDate", ">=", format(monthStart, "yyyy-MM-dd")),
          where("dueDate", "<=", format(monthEnd, "yyyy-MM-dd"))
        ])
      ]);

      const counts: Record<string, number> = {};
      dosesResult.data?.forEach((dose: any) => {
        const key = format(safeDate(dose.dueAt), "yyyy-MM-dd");
        counts[key] = (counts[key] || 0) + 1;
      });
      appointmentsResult.data?.forEach((apt: any) => {
        const key = format(safeDate(apt.date), "yyyy-MM-dd");
        counts[key] = (counts[key] || 0) + 1;
      });
      eventsResult.data?.forEach((event: any) => {
        const key = event.dueDate;
        counts[key] = (counts[key] || 0) + 1;
      });
      setEventCounts(counts);
    } catch (error) {
      console.error("Error loading event counts:", error);
    }
  }, [selectedDate, activeProfile?.id]);

  const loadTomorrowFirstDose = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const tomorrow = addDays(new Date(), 1);
      const tomorrowStart = startOfDay(tomorrow);
      const tomorrowEnd = endOfDay(tomorrow);

      const userId = user.uid;
      const profileId = activeProfile?.id;

      const dosesPath = profileId ? `users/${userId}/profiles/${profileId}/doses` : `users/${userId}/doses`;

      const { data: tomorrowDoses } = await fetchCollection<any>(dosesPath, [
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
  }, [activeProfile?.id, reloadTrigger]);

  const loadData = useCallback(async (date: Date, forceLoading = false) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userId = user.uid;
      const profileId = activeProfile?.id;

      // Evita "ghost" na troca de perfil: aplica cache do perfil (apenas hoje)
      const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      if (profileId && isToday) {
        const cached = getProfileCache(profileId);
        if (cached) {
          // Cache found, apply it
          const cachedDoses = (cached.todayDoses || []) as any[];
          const cachedItems: TimelineItem[] = cachedDoses.map((dose: any) => ({
            id: dose.id,
            time: format(safeDate(dose.dueAt), "HH:mm"),
            type: "medication",
            title: dose.itemName,
            subtitle: dose.doseText || undefined,
            status:
              dose.status === "taken"
                ? "done"
                : dose.status === "missed"
                  ? "missed"
                  : "pending",
            itemId: dose.itemId,
          }));

          setTimelineItems(cachedItems);
          setTodayStats({
            total: cachedDoses.length,
            taken: cachedDoses.filter((d: any) => d.status === "taken").length,
          });

          if (!forceLoading) {
            setLoading(false);
          }
        }
      }

      if (forceLoading) setLoading(true);

      // Load user/profile name
      let profileData: any = null;
      if (profileId) {
        const result = await fetchDocument<any>(`users/${userId}/profiles`, profileId as string);
        profileData = result.data;
      } else {
        const result = await fetchDocument<any>(`users`, userId);
        profileData = result.data;
      }

      if (profileData) {
        setUserName(profileData.nickname || profileData.fullName || "");
      }

      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      // Paths
      const dosesPath = profileId ? `users/${userId}/profiles/${profileId}/doses` : `users/${userId}/doses`;
      const appointmentsPath = profileId ? `users/${userId}/profiles/${profileId}/appointments` : `users/${userId}/appointments`;
      const eventsPath = profileId ? `users/${userId}/profiles/${profileId}/healthEvents` : `users/${userId}/healthEvents`;

      const [dosesResult, appointmentsResult, eventsResult] = await Promise.all([
        fetchCollection<any>(dosesPath, [
          where("dueAt", ">=", dayStart.toISOString()),
          where("dueAt", "<=", dayEnd.toISOString()),
          orderBy("dueAt", "asc")
        ]),
        fetchCollection<any>(appointmentsPath, [
          where("date", ">=", dayStart.toISOString()),
          where("date", "<=", dayEnd.toISOString()),
          orderBy("date", "asc")
        ]),
        fetchCollection<any>(eventsPath, [
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

      doses.forEach((dose: any) => {
        items.push({
          id: dose.id,
          time: format(safeDate(dose.dueAt), "HH:mm"),
          type: "medication",
          title: dose.itemName,
          subtitle: dose.doseText || undefined,
          status: dose.status === "taken" ? "done" : dose.status === "missed" ? "missed" : "pending",
          itemId: dose.itemId,
          onMarkDone: () => markAsTaken(dose.id, dose.itemId, dose.itemName),
          onSnooze: () => snoozeDose(dose.id, dose.itemName)
        });
      });

      appointments.forEach((apt: any) => {
        items.push({
          id: apt.id,
          time: format(safeDate(apt.date), "HH:mm"),
          type: "appointment",
          title: apt.specialty || t('todayRedesign.appointmentDefault'),
          subtitle: apt.doctorName ? t('todayRedesign.doctorPrefix', { name: apt.doctorName }) : apt.location,
          status: apt.status === "done" ? "done" : "pending"
        });
      });

      events.forEach((event: any) => {
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
        const taken = doses.filter((d: any) => d.status === "taken").length;
        setTodayStats({ total, taken });

        // Find next pending dose for Hero widget
        const pendingDoses = doses
          .filter((d: any) => d.status === "scheduled")
          .sort((a: any, b: any) => safeDate(a.dueAt).getTime() - safeDate(b.dueAt).getTime());

        if (pendingDoses.length > 0) {
          setNextPendingDose(pendingDoses[0]);
          setNextDayDose(null);
        } else {
          setNextPendingDose(null);
          // All done for today - fetch tomorrow's first dose
          loadTomorrowFirstDose();
        }
      }

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t("todayRedesign.loadError"));
    } finally {
      setLoading(false);
    }
  }, [activeProfile?.id, t, getProfileCache, loadTomorrowFirstDose, reloadTrigger]); // Added reloadTrigger dependency

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
        quotes = language === 'pt'
          ? [
            "Vamos começar o dia cuidando da sua saúde!",
            "Suas doses da manhã estão te esperando.",
            "Bom dia! Como está se sentindo hoje?"
          ]
          : [
            "Let's start the day taking care of your health!",
            "Your morning doses are waiting for you.",
            "Good morning! How are you feeling today?"
          ];
      } else {
        quotes = language === 'pt'
          ? [
            `${profileName} já tomou os remédios da manhã?`,
            `Confira se ${profileName} está em dia com os medicamentos.`
          ]
          : [
            `Has ${profileName} taken the morning meds?`,
            `Check if ${profileName} is up to date with medications.`
          ];
      }
    } else if (hour < 18) {
      setGreeting(t('today.goodAfternoon'));
      if (isSelf) {
        quotes = language === 'pt'
          ? [
            "Continue firme! Você está cuidando bem de você.",
            "Mantenha o foco na sua saúde.",
            "Não esqueça das doses da tarde!"
          ]
          : [
            "Keep going — you're taking great care of yourself.",
            "Stay focused on your health.",
            "Don't forget your afternoon doses!"
          ];
      } else {
        quotes = language === 'pt'
          ? [
            `Como está ${profileName}? Confira as doses.`,
            `${profileName} tomou o remédio do almoço?`
          ]
          : [
            `How is ${profileName}? Check today's doses.`,
            `Did ${profileName} take the midday dose?`
          ];
      }
    } else {
      setGreeting(t('today.goodEvening'));
      if (isSelf) {
        quotes = language === 'pt'
          ? [
            "Não esqueça dos remédios da noite!",
            "Finalize o dia em dia com sua saúde.",
            "Quase lá! Últimas doses do dia."
          ]
          : [
            "Don't forget your evening meds!",
            "Finish the day with your health on track.",
            "Almost there — last doses of the day."
          ];
      } else {
        quotes = language === 'pt'
          ? [
            `${profileName} já tomou os remédios da noite?`,
            `Confirme as doses de ${profileName} antes de dormir.`
          ]
          : [
            `Has ${profileName} taken the evening meds?`,
            `Confirm ${profileName}'s doses before bedtime.`
          ];
      }
    }

    // Greeting set
  }, [activeProfile, userName, language, t]);

  // Load data when date or profile changes - combined for performance
  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        loadData(selectedDate, true),
        loadEventCounts()
      ]);
    };
    loadAll();
  }, [selectedDate, activeProfile?.id, loadData, loadEventCounts]);

  // Agendar notificações apenas uma vez
  useEffect(() => {
    scheduleNotificationsForNextDay();
  }, [scheduleNotificationsForNextDay]);

  // Realtime subscription para atualizações de doses/consultas/eventos (com debounce)
  const realtimeDebounceRef = useRef<number | null>(null);

  const handleRealtimeChange = useCallback(() => {
    if (realtimeDebounceRef.current) {
      window.clearTimeout(realtimeDebounceRef.current);
    }

    // Increased debounce to 1s to reduce unnecessary renders
    realtimeDebounceRef.current = window.setTimeout(() => {
      loadData(selectedDate);
    }, 1000);
  }, [loadData, selectedDate]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;
    const profileId = activeProfile?.id;

    // Realtime changes using onSnapshot
    const dosesPath = profileId ? `users/${userId}/profiles/${profileId}/doses` : `users/${userId}/doses`;
    const appointmentsPath = profileId ? `users/${userId}/profiles/${profileId}/appointments` : `users/${userId}/appointments`;
    const eventsPath = profileId ? `users/${userId}/profiles/${profileId}/healthEvents` : `users/${userId}/healthEvents`;

    // Only update if external changes happen (not our own optimistic updates)
    // Actually, we can just trigger a reload
    const handleRemoteChange = () => {
      setReloadTrigger(prev => prev + 1);
    }

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
  // Memoized callbacks para evitar re-render do HeroNextDose
  const markAsTaken = useCallback(async (doseId: string, itemId: string, itemName: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userId = user.uid;
      const stockRef = `users/${userId}/stock`;

      const { data: stockData } = await fetchDocument<any>(stockRef, itemId);

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

      // Reload data via trigger
      setReloadTrigger(prev => prev + 1);
      streakData.refresh();
      criticalAlerts.refresh();
    } catch (error) {
      console.error("Error marking dose:", error);
      toast.error(t('todayRedesign.confirmDoseError'));
      throw error;
    }
  }, [t, showFeedback, streakData, criticalAlerts, activeProfile?.id]); // Removed loadData from deps

  const snoozeDose = useCallback(async (doseId: string, itemName: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userId = user.uid;
      const dosePath = activeProfile?.id
        ? `users/${userId}/profiles/${activeProfile.id}/doses`
        : `users/${userId}/doses`;

      const { data: dose } = await fetchDocument<any>(dosePath, doseId);

      if (dose) {
        const newDueAt = new Date(dose.dueAt);
        newDueAt.setMinutes(newDueAt.getMinutes() + 15);

        await updateDocument(dosePath, doseId, {
          dueAt: newDueAt.toISOString()
        });

        toast.success(t('todayRedesign.snoozeSuccess', { name: itemName }));
        toast.success(t('todayRedesign.snoozeSuccess', { name: itemName }));
        setReloadTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error snoozing dose:", error);
      toast.error(t('todayRedesign.snoozeError'));
    }
  }, [t, activeProfile?.id]); // Removed loadData from deps

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

      <main className="page-container container mx-auto max-w-2xl px-4 space-y-6 relative z-10">

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
            <div className="pt-2">
              <h1 className="text-2xl font-bold text-foreground">
                {greeting}{userName ? `, ${userName}` : ''}
              </h1>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 🔴 BLOCO PRINCIPAL - PRÓXIMA DOSE (SEMPRE VISÍVEL NO TOPO) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <HeroNextDose
              dose={nextPendingDose}
              nextDayDose={nextDayDose}
              onTake={markAsTaken}
              onSnooze={snoozeDose}
              allDoneToday={allDoneToday}
            />

            {/* Banner de doses atrasadas */}
            <div id="overdue-banner">
              <OverdueDosesBanner />
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 🤖 CLARA PROATIVA - Sugestões contextuais inteligentes */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <ClaraProactiveCard
              overdueDoses={overdueDoses.length}
              lowStockItems={lowStockItems}
              currentStreak={streakData.currentStreak}
              todayProgress={todayStats}
              onOpenClara={openClara}
              onActionClick={handleClaraAction}
            />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 📊 STATUS DO DIA - Memoizado */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <TodayStatusCard
              streak={streakData.currentStreak}
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
            {criticalAlerts.alerts.length > 0 && (
              <CriticalAlertBanner
                alerts={criticalAlerts.alerts}
                onDismiss={(id) => criticalAlerts.dismissAlert(id)}
                onDismissAll={() => criticalAlerts.dismissAll()}
              />
            )}

            <StockAlertWidget />

            {/* Drug Interaction Alert */}
            <DrugInteractionAlert />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 📅 CALENDÁRIO (SECUNDÁRIO - Abaixo da ação principal) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <ModernWeekCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              profileId={activeProfile?.id}
            />

            {/* Timeline Completa - Visão do dia inteiro */}
            <div className="mt-6 mb-24 px-1">
              <DayTimeline date={selectedDate} items={timelineItems} onDateChange={setSelectedDate} />
            </div>

            {/* Widgets secundários */}
            <ExpiredPrescriptionsAlert />
            <VaccineRemindersWidget />
            <MonthlyReportWidget />

            {/* 🎯 FOMO - Streak risk alert */}
            <StreakRiskAlert
              currentStreak={streakData.currentStreak}
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


    </div>
  );
}