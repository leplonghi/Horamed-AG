import { lazy, Suspense } from "react";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
const ProgressDashboard = lazy(() => import("@/components/ProgressDashboard"));
import PageHeader from "@/components/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import OceanBackground from "@/components/ui/OceanBackground";
import Header from "@/components/Header";

export default function Progress({ hideLayout = false }: { hideLayout?: boolean }) {
  const { t } = useLanguage();
  const {
    currentStreak,
    longestStreak,
    thisWeekAverage,
    lastWeekAverage,
    weeklyAdherence,
    loading
  } = useStreakCalculator();

  if (loading) {
    return (
      <div className={cn("bg-background p-4 flex items-center justify-center", !hideLayout && "min-h-screen")}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {!hideLayout && (
        <PageHeader
          title={t('progress.title') || "Seu Progresso"}
          description={t('progress.description') || "Acompanhe sua consistência e metas"}
        />
      )}

      <div className="space-y-6">
        <Suspense fallback={<div className="h-64 flex items-center justify-center animate-pulse bg-muted/20 rounded-3xl" />}>
          <ProgressDashboard
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            thisWeekAverage={thisWeekAverage}
            lastWeekAverage={lastWeekAverage}
            weeklyAdherence={weeklyAdherence}
            monthlyGoal={90} // Default or fetched from settings
            monthlyProgress={thisWeekAverage} // Approximation for now, effectively using weekly avg as proxy
          />
        </Suspense>
      </div>
    </div>
  );

  if (hideLayout) {
    return content;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <OceanBackground variant="page" />
      <Header />
      
      <main className="page-container container mx-auto max-w-2xl px-4 space-y-6 relative z-10 pb-24">
        {content}
      </main>
    </div>
  );
}
