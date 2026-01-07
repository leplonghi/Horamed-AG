import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useMedicationAlarm } from "@/hooks/useMedicationAlarm";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { useMilestoneDetector } from "@/hooks/useMilestoneDetector";
import { useCriticalAlerts } from "@/hooks/useCriticalAlerts";
import { useFeedbackToast } from "@/hooks/useFeedbackToast";
import DayTimeline from "@/components/DayTimeline";
import ImprovedCalendar from "@/components/ImprovedCalendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CriticalAlertBanner from "@/components/CriticalAlertBanner";
import MilestoneReward from "@/components/gamification/MilestoneReward";
import AchievementShareDialog from "@/components/gamification/AchievementShareDialog";
import { useAchievements } from "@/hooks/useAchievements";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useProfileCacheContext } from "@/contexts/ProfileCacheContext";
import { useSmartRedirect } from "@/hooks/useSmartRedirect";
import { VaccineRemindersWidget } from "@/components/VaccineRemindersWidget";
import { ExpiredPrescriptionsAlert } from "@/components/ExpiredPrescriptionsAlert";
import { Gift, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import HydrationWidget from "@/components/fitness/HydrationWidget";
import EnergyHintWidget from "@/components/fitness/EnergyHintWidget";
import SupplementConsistencyWidget from "@/components/fitness/SupplementConsistencyWidget";
import { useFitnessPreferences } from "@/hooks/useFitnessPreferences";
import TutorialHint from "@/components/TutorialHint";
import { trackDoseTaken } from "@/hooks/useAppMetrics";
import { OverdueDosesBanner } from "@/components/OverdueDosesBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import StockAlertWidget from "@/components/StockAlertWidget";
import MonthlyReportWidget from "@/components/MonthlyReportWidget";
import HeroNextDose from "@/components/HeroNextDose";
import RoutineStatusSummary from "@/components/RoutineStatusSummary";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import QuickDoseWidget from "@/components/QuickDoseWidget";
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [motivationalQuote, setMotivationalQuote] = useState("");
  const [userName, setUserName] = useState("");
  const [todayStats, setTodayStats] = useState({
    total: 0,
    taken: 0,
  });
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [hasAnyItems, setHasAnyItems] = useState(true);
  const [showMilestoneReward, setShowMilestoneReward] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [hasSupplements, setHasSupplements] = useState(false);
  const [nextPendingDose, setNextPendingDose] = useState<any>(null);
  const [nextDayDose, setNextDayDose] = useState<{ time: string; name: string } | null>(null);
  const {
    preferences
  } = useFitnessPreferences();
  const [tutorialsEnabled, setTutorialsEnabled] = useState(true);

  useEffect(() => {
    const loadTutorialPreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_flags")
        .eq("user_id", user.id)
        .single();
      
      if (profile?.tutorial_flags) {
        const flags = profile.tutorial_flags as Record<string, boolean>;
        setTutorialsEnabled(!flags['tutorials_disabled']);
      }
    };
    loadTutorialPreference();
  }, []);

  const toggleTutorials = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newState = !tutorialsEnabled;
    setTutorialsEnabled(newState);

    const { data: profile } = await supabase
      .from("profiles")
      .select("tutorial_flags")
      .eq("user_id", user.id)
      .single();

    const currentFlags = (profile?.tutorial_flags as Record<string, boolean>) || {};
    const newFlags = { ...currentFlags, tutorials_disabled: !newState };

    await supabase
      .from("profiles")
      .update({ tutorial_flags: newFlags })
      .eq("user_id", user.id);

    toast.success(newState ? t('todayRedesign.tutorialsEnabled') : t('todayRedesign.tutorialsDisabled'));
  };

  // Check if user has supplements
  useEffect(() => {
    const checkSupplements = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      let query = supabase.from("items").select("id", {
        count: "exact",
        head: true
      }).in("category", ["suplemento", "vitamina"]).eq("is_active", true).eq("user_id", user.id);
      if (activeProfile?.id) {
        query = query.eq("profile_id", activeProfile.id);
      }
      const {
        count
      } = await query;
      setHasSupplements((count || 0) > 0);
    };
    checkSupplements();
  }, [activeProfile]);
  useEffect(() => {
    if (isNewMilestone && milestone) {
      setShowMilestoneReward(true);
    }
  }, [isNewMilestone, milestone]);
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const monthStart = startOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      const monthEnd = endOfDay(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));
      let itemsQuery = supabase.from("items").select("id");
      if (activeProfile) {
        itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      }
      const {
        data: profileItems
      } = await itemsQuery;
      const itemIds = profileItems?.map(item => item.id) || [];
      let dosesPromise;
      if (itemIds.length > 0) {
        dosesPromise = supabase.from("dose_instances").select("due_at").in("item_id", itemIds).gte("due_at", monthStart.toISOString()).lte("due_at", monthEnd.toISOString());
      } else {
        dosesPromise = Promise.resolve({
          data: []
        });
      }
      let appointmentsQuery = supabase.from("consultas_medicas").select("data_consulta").eq("user_id", user.id).gte("data_consulta", monthStart.toISOString()).lte("data_consulta", monthEnd.toISOString());
      if (activeProfile) {
        appointmentsQuery = appointmentsQuery.eq("profile_id", activeProfile.id);
      }
      let eventsQuery = supabase.from("eventos_saude").select("due_date").eq("user_id", user.id).eq("type", "renovacao_exame").gte("due_date", format(monthStart, "yyyy-MM-dd")).lte("due_date", format(monthEnd, "yyyy-MM-dd"));
      if (activeProfile) {
        eventsQuery = eventsQuery.eq("profile_id", activeProfile.id);
      }
      const [dosesData, appointmentsData, eventsData] = await Promise.all([dosesPromise, appointmentsQuery, eventsQuery]);
      const counts: Record<string, number> = {};
      dosesData.data?.forEach((dose: any) => {
        const key = format(new Date(dose.due_at), "yyyy-MM-dd");
        counts[key] = (counts[key] || 0) + 1;
      });
      appointmentsData.data?.forEach((apt: any) => {
        const key = format(new Date(apt.data_consulta), "yyyy-MM-dd");
        counts[key] = (counts[key] || 0) + 1;
      });
      eventsData.data?.forEach((event: any) => {
        const key = event.due_date;
        counts[key] = (counts[key] || 0) + 1;
      });
      setEventCounts(counts);
    } catch (error) {
      console.error("Error loading event counts:", error);
    }
  }, [selectedDate, activeProfile?.id]);

  const loadTomorrowFirstDose = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tomorrow = addDays(new Date(), 1);
      const tomorrowStart = startOfDay(tomorrow);
      const tomorrowEnd = endOfDay(tomorrow);

      let itemsQuery = supabase.from("items").select("id");
      if (activeProfile) {
        itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      }
      const { data: profileItems } = await itemsQuery;
      const itemIds = profileItems?.map(item => item.id) || [];

      if (itemIds.length > 0) {
        const { data: tomorrowDoses } = await supabase
          .from("dose_instances")
          .select(`due_at, items (name)`)
          .in("item_id", itemIds)
          .gte("due_at", tomorrowStart.toISOString())
          .lte("due_at", tomorrowEnd.toISOString())
          .eq("status", "scheduled")
          .order("due_at", { ascending: true })
          .limit(1);

        if (tomorrowDoses && tomorrowDoses.length > 0) {
          const dose = tomorrowDoses[0] as any;
          setNextDayDose({
            time: format(new Date(dose.due_at), "HH:mm"),
            name: dose.items?.name || ""
          });
        } else {
          setNextDayDose(null);
        }
      }
    } catch (error) {
      console.error("Error loading tomorrow doses:", error);
    }
  }, [activeProfile?.id]);

  const loadData = useCallback(async (date: Date, forceLoading = false) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Evita "ghost" na troca de perfil: aplica cache do perfil (apenas hoje)
      const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      if (activeProfile?.id && isToday) {
        const cached = getProfileCache(activeProfile.id);
        if (cached) {
          setHasAnyItems((cached.medications?.length || 0) > 0);

          const cachedDoses = (cached.todayDoses || []) as any[];
          const cachedItems: TimelineItem[] = cachedDoses.map((dose: any) => ({
            id: dose.id,
            time: format(new Date(dose.due_at), "HH:mm"),
            type: "medication",
            title: dose.items?.name,
            subtitle: dose.items?.dose_text || undefined,
            status:
              dose.status === "taken"
                ? "done"
                : dose.status === "missed"
                ? "missed"
                : "pending",
            itemId: dose.item_id,
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

      const { data: profileData } = await supabase
        .from("profiles")
        .select("nickname, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setUserName(profileData.nickname || profileData.full_name || "");
      }
      let allItemsQuery = supabase.from("items").select("id", {
        count: "exact",
        head: true
      });
      if (activeProfile) {
        allItemsQuery = allItemsQuery.eq("profile_id", activeProfile.id);
      }
      const {
        count: itemCount
      } = await allItemsQuery;
      setHasAnyItems((itemCount || 0) > 0);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      let itemsQuery = supabase.from("items").select("id");
      if (activeProfile) {
        itemsQuery = itemsQuery.eq("profile_id", activeProfile.id);
      }
      const {
        data: profileItems
      } = await itemsQuery;
      const itemIds = profileItems?.map(item => item.id) || [];
      let doses = null;
      if (itemIds.length > 0) {
        const {
          data: dosesData
        } = await supabase.from("dose_instances").select(`id, due_at, status, item_id, items (name, dose_text, with_food, category)`).in("item_id", itemIds).gte("due_at", dayStart.toISOString()).lte("due_at", dayEnd.toISOString()).order("due_at", {
          ascending: true
        });
        doses = dosesData;
      } else {
        doses = [];
      }
      let appointmentsQuery = supabase.from("consultas_medicas").select("*").eq("user_id", user.id).gte("data_consulta", dayStart.toISOString()).lte("data_consulta", dayEnd.toISOString());
      if (activeProfile) {
        appointmentsQuery = appointmentsQuery.eq("profile_id", activeProfile.id);
      }
      const {
        data: appointments
      } = await appointmentsQuery.order("data_consulta", {
        ascending: true
      });
      let eventsQuery = supabase.from("eventos_saude").select("*").eq("user_id", user.id).eq("type", "renovacao_exame").gte("due_date", format(dayStart, "yyyy-MM-dd")).lte("due_date", format(dayEnd, "yyyy-MM-dd"));
      if (activeProfile) {
        eventsQuery = eventsQuery.eq("profile_id", activeProfile.id);
      }
      const {
        data: events
      } = await eventsQuery.order("due_date", {
        ascending: true
      });
      const items: TimelineItem[] = [];
      doses?.forEach((dose: any) => {
        items.push({
          id: dose.id,
          time: format(new Date(dose.due_at), "HH:mm"),
          type: "medication",
          title: dose.items.name,
          subtitle: dose.items.dose_text || undefined,
          status: dose.status === "taken" ? "done" : dose.status === "missed" ? "missed" : "pending",
          itemId: dose.item_id,
          onMarkDone: () => markAsTaken(dose.id, dose.item_id, dose.items.name),
          onSnooze: () => snoozeDose(dose.id, dose.items.name)
        });
      });
      appointments?.forEach((apt: any) => {
        items.push({
          id: apt.id,
          time: format(new Date(apt.data_consulta), "HH:mm"),
          type: "appointment",
          title: apt.especialidade || t('todayRedesign.appointmentDefault'),
          subtitle: apt.medico_nome ? t('todayRedesign.doctorPrefix', { name: apt.medico_nome }) : apt.local,
          status: apt.status === "realizada" ? "done" : "pending"
        });
      });
      events?.forEach((event: any) => {
        items.push({
          id: event.id,
          time: "09:00",
          type: "exam",
          title: event.title,
          subtitle: event.notes || undefined,
          status: event.completed_at ? "done" : "pending"
        });
      });
      items.sort((a, b) => a.time.localeCompare(b.time));
      setTimelineItems(items);
      const isToday2 = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      if (isToday2 && doses) {
        const total = doses.length;
        const taken = doses.filter((d: any) => d.status === "taken").length;
        setTodayStats({ total, taken });
        
        // Find next pending dose for Hero widget
        const now = new Date();
        const pendingDoses = doses
          .filter((d: any) => d.status === "scheduled")
          .sort((a: any, b: any) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
        
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
  }, [activeProfile?.id, t, getProfileCache]);

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

    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [activeProfile, userName, language, t]);

  // Load data when date or profile changes
  useEffect(() => {
    loadData(selectedDate, true);
    loadEventCounts();
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

    realtimeDebounceRef.current = window.setTimeout(() => {
      loadData(selectedDate);
    }, 600);
  }, [loadData, selectedDate]);

  useEffect(() => {
    const channel = supabase
      .channel("timeline-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dose_instances" },
        handleRealtimeChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "consultas_medicas" },
        handleRealtimeChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "eventos_saude" },
        handleRealtimeChange
      )
      .subscribe();

    return () => {
      if (realtimeDebounceRef.current) {
        window.clearTimeout(realtimeDebounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [activeProfile?.id, handleRealtimeChange]);
  const markAsTaken = async (doseId: string, itemId: string, itemName: string) => {
    try {
      const {
        data: stockData
      } = await supabase.from("stock").select("units_left").eq("item_id", itemId).single();
      if (stockData && stockData.units_left === 0) {
        toast.error(t('todayRedesign.stockEmpty'));
        return;
      }
      await supabase.from("dose_instances").update({
        status: "taken",
        taken_at: new Date().toISOString()
      }).eq("id", doseId);
      if (stockData && stockData.units_left > 0) {
        await supabase.from("stock").update({
          units_left: stockData.units_left - 1
        }).eq("item_id", itemId);
      }
      // Track metric
      trackDoseTaken(doseId, itemName);
      
      showFeedback("dose-taken", {
        medicationName: itemName
      });
      loadData(selectedDate);
      streakData.refresh();
      criticalAlerts.refresh();
    } catch (error) {
      console.error("Error marking dose:", error);
      toast.error(t('todayRedesign.confirmDoseError'));
    }
  };
  const snoozeDose = async (doseId: string, itemName: string) => {
    try {
      const {
        data: dose
      } = await supabase.from("dose_instances").select("due_at").eq("id", doseId).single();
      if (dose) {
        const newDueAt = new Date(dose.due_at);
        newDueAt.setMinutes(newDueAt.getMinutes() + 15);
        await supabase.from("dose_instances").update({
          due_at: newDueAt.toISOString()
        }).eq("id", doseId);
        toast.success(t('todayRedesign.snoozeSuccess', { name: itemName }));
        loadData(selectedDate);
      }
    } catch (error) {
      console.error("Error snoozing dose:", error);
      toast.error(t('todayRedesign.snoozeError'));
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="page-container container mx-auto max-w-2xl px-4 space-y-4">
        {/* Overdue doses banner */}
        <OverdueDosesBanner />

        {/* Compact Greeting */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">
              {greeting}{userName && `, ${userName}`}!
            </h1>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {streakData.currentStreak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-xs font-medium">
                🔥 {streakData.currentStreak}
              </div>
            )}
          </div>
        </div>

        {/* ⭐ HERO: Next Dose - ALWAYS AT TOP */}
        <HeroNextDose
          dose={nextPendingDose}
          nextDayDose={nextDayDose}
          onTake={markAsTaken}
          allDoneToday={todayStats.total > 0 && todayStats.taken === todayStats.total}
        />

        {/* Status Summary */}
        <RoutineStatusSummary
          streak={streakData.currentStreak}
          todayProgress={todayStats}
        />

        {/* Critical Alerts - Compact */}
        {criticalAlerts.alerts.length > 0 && (
          <CriticalAlertBanner
            alerts={criticalAlerts.alerts}
            onDismiss={(id) => criticalAlerts.dismissAlert(id)}
            onDismissAll={() => criticalAlerts.dismissAll()}
          />
        )}

        {/* Alerts compactos */}
        <ExpiredPrescriptionsAlert />
        <VaccineRemindersWidget />

        {/* Stock & Report */}
        <StockAlertWidget />
        <MonthlyReportWidget />

        {/* Calendário simples */}
        <ImprovedCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} eventCounts={eventCounts} />

        {/* Timeline do dia */}
        <DayTimeline date={selectedDate} items={timelineItems} onDateChange={setSelectedDate} />

        {/* Secondary Stats Row - Colorful */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Adherence - Primary color */}
          <Card className="p-3 bg-gradient-to-br from-green-500/15 to-green-500/5 border-green-500/20">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-green-600 dark:text-green-400 uppercase tracking-wide font-medium">{t('todayRedesign.dosesTodayLabel')}</p>
                <p className="text-lg font-bold text-foreground">
                  {todayStats.taken}/{todayStats.total}
                </p>
              </div>
              <div className={cn(
                "text-2xl font-bold",
                todayStats.total > 0 && todayStats.taken === todayStats.total
                  ? "text-green-500"
                  : todayStats.taken > 0
                  ? "text-primary"
                  : "text-muted-foreground"
              )}>
                {todayStats.total > 0 ? Math.round((todayStats.taken / todayStats.total) * 100) : 0}%
              </div>
            </div>
          </Card>

          {/* Insights - Blue accent */}
          <Card
            className="p-3 cursor-pointer hover:shadow-md transition-all bg-gradient-to-br from-blue-500/15 to-blue-500/5 border-blue-500/20 active:scale-[0.98]"
            onClick={() => navigate('/evolucao')}
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">{t('todayRedesign.insightsTitle')}</p>
                <p className="text-[10px] text-muted-foreground">{t('todayRedesign.insightsDesc')}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Dose Widget - Full width */}
        <div className="mb-4">
          <QuickDoseWidget />
        </div>

        {/* Fitness Widgets - Conditional */}
        {hasSupplements && preferences.showFitnessWidgets && (
          <div className="space-y-2 mb-4">
            <HydrationWidget />
            <SupplementConsistencyWidget last7Days={[80, 85, 90, 75, 95, 88, 92]} />
            <EnergyHintWidget />
          </div>
        )}

        {/* Tutorial Hints */}
        {tutorialsEnabled && (
          <TutorialHint
            id="today_overview"
            title="📅 Sua rotina de hoje"
            message="Marque as doses quando tomar. O calendário mostra seus compromissos do mês."
            placement="bottom"
          />
        )}

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
      </main>

      <Navigation />
    </div>
  );
}