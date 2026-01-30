import { useState, useEffect } from "react";
import { auth, fetchCollection, where, orderBy } from "@/integrations/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import StreakBadge from "@/components/StreakBadge";
import InteractiveTimelineChart from "@/components/InteractiveTimelineChart";
import { MonthlyProgressCalendar } from "@/components/MonthlyProgressCalendar";
import DoseTimeline from "@/components/DoseTimeline";
import InfoDialog from "@/components/InfoDialog";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, subDays, startOfDay } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Target,
  BarChart3,
  Minus
} from "lucide-react";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";

interface DoseInstance {
  id: string;
  itemId: string;
  dueAt: string;
  status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  takenAt: string | null;
  items: {
    name: string;
    doseText: string | null;
  };
}

interface Stats {
  total: number;
  taken: number;
  missed: number;
  skipped: number;
  progressRate: number;
}

interface MedicationStats {
  name: string;
  total: number;
  taken: number;
  progressRate: number;
}

export default function History() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today');
  const [doses, setDoses] = useState<DoseInstance[]>([]);
  const [previousDoses, setPreviousDoses] = useState<DoseInstance[]>([]);
  const [loadingEffects, setLoadingEffects] = useState(true);
  const [medicationStats, setMedicationStats] = useState<MedicationStats[]>([]);
  const { activeProfile } = useUserProfiles();

  // Use the streak calculator hook
  const { currentStreak, longestStreak, loading: streakLoading, refresh: refreshStreak } = useStreakCalculator();

  const dateLocale = language === 'pt' ? ptBR : enUS;

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  // Reload data when active profile changes
  useEffect(() => {
    if (activeProfile) {
      setLoadingEffects(true);
      loadAllData();
      refreshStreak();
    }
  }, [activeProfile?.id]);

  const loadAllData = async () => {
    setLoadingEffects(true);
    try {
      await Promise.all([
        loadDoses(),
        loadMedicationStats()
      ]);
    } finally {
      setLoadingEffects(false);
    }
  };

  const loadDoses = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      let startDate: Date;
      let endDate: Date;
      let previousStartDate: Date;
      let previousEndDate: Date;

      const now = new Date();

      if (activeTab === 'today') {
        startDate = startOfDay(now);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        previousStartDate = subDays(startDate, 1);
        previousEndDate = subDays(endDate, 1);
      } else if (activeTab === 'week') {
        startDate = startOfWeek(now, { locale: dateLocale });
        endDate = endOfWeek(now, { locale: dateLocale });
        previousStartDate = subWeeks(startDate, 1);
        previousEndDate = subWeeks(endDate, 1);
      } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = subMonths(startDate, 1);
        previousEndDate = subMonths(endDate, 1);
      }

      // Fetch active items first for name resolution
      const { data: items } = await fetchCollection<any>(`users/${user.uid}/medications`);
      const itemsMap = new Map(items?.map(i => [i.id, i]));

      // Query Constraints
      const constraints = [
        where('dueAt', '>=', startDate.toISOString()),
        where('dueAt', '<=', endDate.toISOString()),
        orderBy('dueAt', 'desc')
      ];

      const { data: dosesData } = await fetchCollection<any>(`users/${user.uid}/doses`, constraints);

      const mappedDoses = (dosesData || []).map(dose => {
        const item = itemsMap.get(dose.itemId);
        // Filter by profile if activeProfile is set and item has profileId
        if (activeProfile && item?.profileId && item.profileId !== activeProfile.id) return null;

        return {
          id: dose.id,
          itemId: dose.itemId,
          dueAt: dose.dueAt,
          status: dose.status,
          takenAt: dose.takenAt,
          items: {
            name: item?.name || 'Unknown',
            doseText: item?.doseText || null
          }
        };
      }).filter(Boolean) as DoseInstance[];

      setDoses(mappedDoses);

      // Previous period
      const prevConstraints = [
        where('dueAt', '>=', previousStartDate.toISOString()),
        where('dueAt', '<=', previousEndDate.toISOString())
      ];
      const { data: prevDosesData } = await fetchCollection<any>(`users/${user.uid}/doses`, prevConstraints);

      const mappedPrevDoses = (prevDosesData || []).map(dose => {
        const item = itemsMap.get(dose.itemId);
        if (activeProfile && item?.profileId && item.profileId !== activeProfile.id) return null;

        return {
          id: dose.id,
          itemId: dose.itemId,
          dueAt: dose.dueAt,
          status: dose.status,
          takenAt: dose.takenAt,
          items: {
            name: item?.name || 'Unknown',
            doseText: item?.doseText || null
          }
        };
      }).filter(Boolean) as DoseInstance[];

      setPreviousDoses(mappedPrevDoses);

    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const loadMedicationStats = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);

      // Fetch active items first
      const { data: items } = await fetchCollection<any>(`users/${user.uid}/medications`);
      const itemsMap = new Map(items?.map(i => [i.id, i]));

      const { data: dosesData } = await fetchCollection<any>(`users/${user.uid}/doses`, [
        where('dueAt', '>=', thirtyDaysAgo.toISOString()),
        where('dueAt', '<=', now.toISOString())
      ]);

      // Group by medication
      const statsByMed = (dosesData || []).reduce((acc, dose: any) => {
        const item = itemsMap.get(dose.itemId);
        if (activeProfile && item?.profileId && item.profileId !== activeProfile.id) return acc;

        const medName = item?.name || 'Unknown';

        if (!acc[medName]) {
          acc[medName] = { name: medName, total: 0, taken: 0 };
        }
        acc[medName].total++;
        if (dose.status === 'taken') {
          acc[medName].taken++;
        }
        return acc;
      }, {} as Record<string, { name: string; total: number; taken: number }>);

      const stats = Object.values(statsByMed).map(stat => ({
        ...stat,
        progressRate: stat.total > 0 ? Math.round((stat.taken / stat.total) * 100) : 0
      })).sort((a, b) => b.progressRate - a.progressRate);

      setMedicationStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const calculateStats = (dosesData: DoseInstance[]): Stats => {
    const total = dosesData.length;
    const taken = dosesData.filter(d => d.status === 'taken').length;
    const missed = dosesData.filter(d => d.status === 'missed').length;
    const skipped = dosesData.filter(d => d.status === 'skipped').length;
    const progressRate = total > 0 ? Math.round((taken / total) * 100) : 0;

    return { total, taken, missed, skipped, progressRate };
  };

  const currentStats = calculateStats(doses);
  const previousStats = calculateStats(previousDoses);
  const difference = currentStats.progressRate - previousStats.progressRate;

  const getPeriodLabel = () => {
    switch (activeTab) {
      case 'today': return t('history.todayLabel');
      case 'week': return t('history.thisWeek');
      case 'month': return t('history.thisMonth');
    }
  };

  const getPreviousPeriodLabel = () => {
    switch (activeTab) {
      case 'today': return t('history.yesterday');
      case 'week': return t('history.lastWeek');
      case 'month': return t('history.lastMonth');
    }
  };

  if (loadingEffects || streakLoading) {
    return (
      <>
        <Header />
        <PageSkeleton />
        <Navigation />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container max-w-4xl mx-auto px-4 pt-20 pb-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('history.title')}</h1>
            <p className="text-muted-foreground">
              {t('history.subtitle')}
            </p>
          </div>
          {currentStreak > 0 && <StreakBadge streak={currentStreak} type="current" />}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Target className="h-4 w-4" />
                <span className="text-sm">{t('history.progress')}</span>
                <InfoDialog
                  title={t('history.progress')}
                  description={t('history.progressDesc')}
                  triggerClassName="h-4 w-4"
                />
              </div>
              <div className="text-3xl font-bold text-primary">
                {currentStats.progressRate}%
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                {difference > 0 && (
                  <>
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-success">+{difference}%</span>
                  </>
                )}
                {difference < 0 && (
                  <>
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    <span className="text-destructive">{difference}%</span>
                  </>
                )}
                {difference === 0 && (
                  <>
                    <Minus className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('history.noChange')}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">{t('history.sequence')}</span>
                <InfoDialog
                  title={t('history.sequence')}
                  description={t('history.sequenceDesc')}
                  triggerClassName="h-4 w-4"
                />
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {currentStreak}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('history.record')}: {longestStreak} {t('history.days')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{t('history.taken')}</span>
                <InfoDialog
                  title={t('history.taken')}
                  description={t('history.takenDesc')}
                  triggerClassName="h-4 w-4"
                />
              </div>
              <div className="text-3xl font-bold text-success">
                {currentStats.taken}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('history.ofDoses')} {currentStats.total} {t('history.doses')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">{t('history.missed')}</span>
                <InfoDialog
                  title={t('history.missed')}
                  description={t('history.missedDesc')}
                  triggerClassName="h-4 w-4"
                />
              </div>
              <div className="text-3xl font-bold text-destructive">
                {currentStats.missed + currentStats.skipped}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {currentStats.missed} {t('history.missed').toLowerCase()}, {currentStats.skipped} {t('history.skipped')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">{t('history.today')}</TabsTrigger>
            <TabsTrigger value="week">{t('history.week')}</TabsTrigger>
            <TabsTrigger value="month">{t('history.month')}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {/* Comparison Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('history.periodComparison')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{getPeriodLabel()}</span>
                    <span className="text-lg font-bold text-primary">
                      {currentStats.progressRate}%
                    </span>
                  </div>
                  <Progress value={currentStats.progressRate} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentStats.taken} {t('history.ofDoses')} {currentStats.total} {t('history.dosesTaken')}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {getPreviousPeriodLabel()}
                    </span>
                    <span className="text-lg font-bold text-muted-foreground">
                      {previousStats.progressRate}%
                    </span>
                  </div>
                  <Progress value={previousStats.progressRate} className="h-2 opacity-50" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {previousStats.taken} {t('history.ofDoses')} {previousStats.total} {t('history.dosesTaken')}
                  </p>
                </div>

                {difference !== 0 && (
                  <div className={`p-3 rounded-lg ${difference > 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    <p className={`text-sm font-medium ${difference > 0 ? 'text-success' : 'text-destructive'}`}>
                      {difference > 0 ? (
                        <>🎉 {t('history.congratsImproved', { percent: String(Math.abs(difference)), period: getPreviousPeriodLabel().toLowerCase() })}</>
                      ) : (
                        <>⚠️ {t('history.commitmentDropped', { percent: String(Math.abs(difference)), period: getPreviousPeriodLabel().toLowerCase() })}</>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visualization Options */}
            <Tabs defaultValue="timeline" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="timeline">{t('history.timeline')}</TabsTrigger>
                <TabsTrigger value="calendar">{t('history.monthlyCalendar')}</TabsTrigger>
                <TabsTrigger value="list">{t('history.doseList')}</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline">
                <InteractiveTimelineChart
                  doses={doses}
                  period={activeTab}
                />
              </TabsContent>

              <TabsContent value="calendar">
                <MonthlyProgressCalendar
                  profileId={activeProfile?.id}
                />
              </TabsContent>

              <TabsContent value="list">
                <DoseTimeline
                  doses={doses}
                  period={activeTab}
                />
              </TabsContent>
            </Tabs>

            {/* Medication Stats */}
            {medicationStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('history.byMedication')} ({t('history.last30days')})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {medicationStats.map((med) => (
                    <div key={med.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{med.name}</span>
                        <span className="text-sm font-bold text-primary">
                          {med.progressRate}%
                        </span>
                      </div>
                      <Progress value={med.progressRate} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {med.taken} {t('history.ofDoses')} {med.total} {t('history.dosesTaken')}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Navigation />
    </div>
  );
}