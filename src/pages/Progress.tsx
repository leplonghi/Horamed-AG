import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import ProgressDashboard from "@/components/ProgressDashboard";
import PageHeader from "@/components/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Progress() {
  const { t } = useLanguage();
  const {
    currentStreak,
    longestStreak,
    thisWeekAverage,
    lastWeekAverage,
    loading
  } = useStreakCalculator();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-container pb-24">
      <PageHeader
        title={t('progress.title') || "Seu Progresso"}
        description={t('progress.description') || "Acompanhe sua consistência e metas"}
      />

      <div className="container mx-auto p-4 space-y-6">
        <ProgressDashboard
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          thisWeekAverage={thisWeekAverage}
          lastWeekAverage={lastWeekAverage}
          monthlyGoal={90} // Default or fetched from settings
          monthlyProgress={thisWeekAverage} // Approximation for now, effectively using weekly avg as proxy
        />
      </div>
    </div>
  );
}
