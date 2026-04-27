import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/integrations/firebase/client";
import { fetchDocument, updateDocument } from "@/integrations/firebase";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

import Header from "@/components/Header";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { useMilestoneDetector } from "@/hooks/useMilestoneDetector";
import { useCriticalAlerts } from "@/hooks/useCriticalAlerts";
import { useFeedbackToast } from "@/hooks/useFeedbackToast";
import DayTimeline from "@/components/DayTimeline";
import ModernWeekCalendar from "@/components/ModernWeekCalendar";
import CriticalAlertBanner from "@/components/CriticalAlertBanner";
import MilestoneReward from "@/components/gamification/MilestoneReward";
import AchievementShareDialog from "@/components/gamification/AchievementShareDialog";
import { useAchievements, Achievement } from "@/hooks/useAchievements";
import { useUserProfiles } from "@/hooks/useUserProfiles";
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
import { medicationRepository } from "@/infrastructure/firebase/MedicationRepository";
import VitalsGlanceWidget from "@/components/VitalsGlanceWidget";
import { TodayStatusCard } from "@/components/today/TodayStatusCard";
import { AndroidPermissionsCard } from "@/components/AndroidPermissionsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyCheckInWidget } from "@/components/symptoms/DailyCheckInWidget";
import { TodaySkeleton } from "@/components/LoadingSkeleton";
import TrialReminderBanner from "@/components/TrialReminderBanner";
import FamilyPulseWidget from "@/components/FamilyPulseWidget";
import { Lock } from "@phosphor-icons/react";

import MicroCelebration from "@/components/celebrations/MicroCelebration";
import ConfettiExplosion from "@/components/celebrations/ConfettiExplosion";
import DailyCompleteModal from "@/components/celebrations/DailyCompleteModal";
import DoseActionModal from "@/components/DoseActionModal";

import { useTodayData } from "@/hooks/useTodayData";
import { useGreeting } from "@/hooks/useGreeting";

import { safeDateParse } from "@/lib/safeDateUtils";
import { Dose } from "@/types/dose";

interface StockItem {
  id: string;
  itemId?: string;
  itemName: string;
  currentQty: number;
  alertThreshold?: number;
}

export default function Today() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { scheduleNext48Hours } = usePushNotifications();
  const { currentStreak, refresh: refreshStreak } = useStreakCalculator();
  const { milestone, isNewMilestone, markAsSeen } = useMilestoneDetector();
  const { achievements } = useAchievements();
  const { alerts, refresh: refreshAlerts, dismissAlert, dismissAll } = useCriticalAlerts();
  const { showFeedback } = useFeedbackToast();
  const { activeProfile, profiles, switchProfile } = useUserProfiles();
  const { t, language } = useLanguage();
  useSmartRedirect();
  const { overdueDoses } = useOverdueDoses();

  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMilestoneReward, setShowMilestoneReward] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showMicroCelebration, setShowMicroCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<"dose_taken" | "streak_day" | "perfect_day" | "milestone" | "level_up" | "combo">("dose_taken");
  const [showDailyComplete, setShowDailyComplete] = useState(false);
  const [isDoseModalOpen, setIsDoseModalOpen] = useState(false);
  const [selectedDoseForModal, setSelectedDoseForModal] = useState<any>(null);

  // We use a ref for stats to break the circular dependency between markAsTaken and useTodayData
  const todayStatsRef = useRef({ total: 0, taken: 0 });

  useEffect(() => {
    if (isNewMilestone && milestone) {
      setShowMilestoneReward(true);
    }
  }, [isNewMilestone, milestone]);

  // Handle Clara action clicks
  const handleClaraAction = useCallback((action: string) => {
    if (action === "overdue") {
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

      await medicationRepository.markDoseAsTaken(userId, activeProfile?.id, doseId, itemId, itemName);

      if (stockData && stockData.currentQty > 0) {
        await updateDocument(stockRef, itemId, {
          currentQty: stockData.currentQty - 1
        });
      }

      trackDoseTaken(doseId, itemName);

      const stats = todayStatsRef.current;
      if (stats.total > 0 && stats.taken + 1 === stats.total) {
        setCelebrationType("perfect_day");
        setShowMicroCelebration(true);
        setShowConfetti(true);
        setTimeout(() => {
          setShowDailyComplete(true);
        }, 2000);
      } else {
        setCelebrationType("dose_taken");
        setShowMicroCelebration(true);
        setShowConfetti(true);
      }

      refreshStreak();
      refreshAlerts();
    } catch (error) {
      console.error("Error marking dose:", error);
      toast.error(t('todayRedesign.confirmDoseError'));
      throw error;
    }
  }, [t, showFeedback, refreshStreak, refreshAlerts, activeProfile?.id]);

  const markAsSkipped = useCallback(async (doseId: string, itemName: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await medicationRepository.markDoseAsSkipped(user.uid, activeProfile?.id, doseId, itemName);
      toast.info(t('todayRedesign.skipSuccess', { name: itemName }));
      refreshAlerts();
    } catch (error) {
      console.error("Error skipping dose:", error);
      toast.error(t('todayRedesign.skipError'));
    }
  }, [t, refreshAlerts, activeProfile?.id]);

  const markAsMissed = useCallback(async (doseId: string, itemName: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await medicationRepository.markDoseAsMissed(user.uid, activeProfile?.id, doseId, itemName);
      toast.info(t('todayRedesign.missedSuccess', { name: itemName }));
      refreshAlerts();
    } catch (error) {
      console.error("Error marking dose as missed:", error);
      toast.error(t('todayRedesign.missedError'));
    }
  }, [t, refreshAlerts, activeProfile?.id]);

  const snoozeDose = useCallback(async (doseId: string, itemName: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userId = user.uid;
      const dosePath = activeProfile?.id
        ? "dose_instances"
        : "dose_instances";

      const { data: dose } = await fetchDocument<Dose>(dosePath, doseId);

      if (dose) {
        // Fallback for Dose dueAt object vs string
        const dueAtAny = dose.dueAt || dose.due_at;
        const newDueAt = safeDateParse(typeof dueAtAny === 'string' ? dueAtAny : JSON.stringify(dueAtAny));
        newDueAt.setMinutes(newDueAt.getMinutes() + 15);

        await medicationRepository.snoozeDose(userId, activeProfile?.id, doseId, newDueAt.toISOString(), itemName);

        toast.success(t('todayRedesign.snoozeSuccess', { name: itemName }));
      }
    } catch (error) {
      console.error("Error snoozing dose:", error);
      toast.error(t('todayRedesign.snoozeError'));
    }
  }, [t, activeProfile?.id]);

  const {
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
    claraInsight,
    optimisticMarkDone,
  } = useTodayData(selectedDate, markAsTaken, snoozeDose);

  // Keep the ref updated with the latest stats from the hook
  useEffect(() => {
    todayStatsRef.current = todayStats;
  }, [todayStats]);

  const adherenceRate = todayStats.total > 0
    ? todayStats.taken / todayStats.total
    : undefined;

  const { greetingWithName, subtitle } = useGreeting({
    profileName: activeProfile?.name || userName,
    isSelf: !activeProfile || activeProfile.relationship === 'self',
    adherenceRate,
    todayTotal: todayStats.total,
  });

  useEffect(() => {
    void scheduleNext48Hours();
  }, [scheduleNext48Hours]);

  const allDoneToday = useMemo(() =>
    todayStats.total > 0 && todayStats.taken === todayStats.total,
    [todayStats.total, todayStats.taken]
  );

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {showConfetti && (
        <ConfettiExplosion trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      )}
      
      <MicroCelebration 
        trigger={showMicroCelebration} 
        type={celebrationType} 
        streak={currentStreak}
        onComplete={() => setShowMicroCelebration(false)} 
      />

      <DailyCompleteModal 
        open={showDailyComplete} 
        onOpenChange={setShowDailyComplete}
        streak={currentStreak}
      />

      <DoseActionModal
        open={isDoseModalOpen}
        onOpenChange={setIsDoseModalOpen}
        dose={selectedDoseForModal}
        onAction={async (action) => {
          if (!selectedDoseForModal) return;
          
          if (action === 'taken') {
            await markAsTaken(
              selectedDoseForModal.id, 
              selectedDoseForModal.itemId, 
              selectedDoseForModal.items.name
            );
          } else if (action === 'skipped') {
            await markAsSkipped(selectedDoseForModal.id, selectedDoseForModal.items.name);
          } else if (action === 'missed') {
            await markAsMissed(selectedDoseForModal.id, selectedDoseForModal.items.name);
          } else if (action === 'custom-time') {
            // Handle custom time - potentially open another sub-dialog or just use current time
            await markAsTaken(
              selectedDoseForModal.id, 
              selectedDoseForModal.itemId, 
              selectedDoseForModal.items.name
            );
          }
        }}
      />
      <OceanBackground variant="page" />
      <Header />
      <TrialReminderBanner />

      <main className="page-container container mx-auto max-w-2xl px-4 space-y-4 relative z-10">
        {loading ? (
          <TodaySkeleton />
        ) : (
          <>
            <div className="pt-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="heading-page-fluid text-foreground">
                    {greetingWithName}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {language === "pt" ? "Meu Painel de Saúde" : "My Health Dashboard"} ·{" "}
                      {format(selectedDate, language === "pt" ? "EEEE, d 'de' MMMM" : "EEEE, MMMM d", { locale: language === "pt" ? ptBR : enUS })}
                    </p>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider">
                      <Lock size={10} weight="fill" />
                      Privado & Seguro
                    </div>
                  </div>
                </div>
              </div>
              {subtitle && (
                <p className="text-sm italic text-muted-foreground mt-2 opacity-80 border-l-2 border-primary/30 pl-2">
                  "{subtitle}"
                </p>
              )}
            </div>

            {/* Calendar strip */}
            <ModernWeekCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              profileId={activeProfile?.id}
            />

            {/* Hero next dose */}
            <HeroNextDose
              dose={nextPendingDose}
              nextDayDose={nextDayDose}
              onTake={markAsTaken}
              onSnooze={snoozeDose}
              onMore={(dose) => {
                setSelectedDoseForModal(dose);
                setIsDoseModalOpen(true);
              }}
              allDoneToday={allDoneToday}
              hasMedications={hasMedications}
            />

            {/* Android notification permissions */}
            <AndroidPermissionsCard hideWhenOk={true} />

            {/* Overdue banner */}
            <div id="overdue-banner">
              <OverdueDosesBanner />
            </div>

            {/* Clara AI proactive card */}
            <ClaraProactiveCard
              overdueDoses={overdueDoses?.length || 0}
              lowStockItems={lowStockItems}
              currentStreak={currentStreak}
              todayProgress={todayStats}
              dynamicMessage={claraInsight}
              onOpenClara={openClara}
              onActionClick={handleClaraAction}
            />

            <FamilyPulseWidget 
              profiles={profiles}
              activeProfileId={activeProfile?.id}
              onSwitchProfile={switchProfile}
            />

            {/* Day timeline */}
            <DayTimeline 
              date={selectedDate} 
              items={timelineItems.map(item => ({
                ...item,
                onMore: () => {
                  setSelectedDoseForModal(item);
                  setIsDoseModalOpen(true);
                }
              }))} 
              onDateChange={setSelectedDate} 
            />

            <DailyCheckInWidget
              hasLoggedToday={hasLoggedSymptomsToday}
              onLogComplete={() => setHasLoggedSymptomsToday(true)}
            />

            {/* Vitals glance */}
            <VitalsGlanceWidget profileId={activeProfile?.id} />

            {/* Day status */}
            <TodayStatusCard
              streak={currentStreak}
              taken={todayStats.taken}
              total={todayStats.total}
              language={language}
            />

            {/* Critical alerts */}
            {alerts?.length > 0 && (
              <CriticalAlertBanner
                alerts={alerts}
                onDismiss={(id) => dismissAlert(id)}
                onDismissAll={() => dismissAll()}
              />
            )}

            <StockAlertWidget />
            <DrugInteractionAlert />

            {/* Widgets secundários */}
            <ExpiredPrescriptionsAlert />
            <VaccineRemindersWidget />
            <MonthlyReportWidget />

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
