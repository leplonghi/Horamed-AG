import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { auth, fetchCollection, fetchDocument, where, orderBy } from "@/integrations/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import DoseTimeline from "@/components/DoseTimeline";
import { ArrowLeft, TrendUp as TrendingUp, CalendarBlank as CalendarIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { startOfMonth, endOfMonth } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

interface MedHistoryDoc {
  id: string;
  name: string;
  doseText?: string;
}

interface DoseHistoryDoc {
  id: string;
  itemId: string;
  dueAt: string;
  status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  takenAt: string | null;
  itemName?: string;
  doseText?: string;
}

interface FormattedDose extends DoseHistoryDoc {
  items: { name: string; doseText: string };
}

export default function MedicationHistory() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { activeProfile } = useUserProfiles();
  const [medication, setMedication] = useState<MedHistoryDoc | null>(null);
  const [doses, setDoses] = useState<FormattedDose[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedicationData();
  }, [id, selectedDate, activeProfile?.id]);

  const loadGeneralHistory = async (userId: string) => {
    const profileId = activeProfile?.id;
    const startDate = startOfMonth(selectedDate);
    const endDate = endOfMonth(selectedDate);

    const dosesPath = profileId
      ? `users/${userId}/profiles/${profileId}/doses`
      : `users/${userId}/doses`;

    const { data: dosesData } = await fetchCollection<DoseHistoryDoc>(
      dosesPath,
      [
        where('dueAt', '>=', startDate.toISOString()),
        where('dueAt', '<=', endDate.toISOString()),
        orderBy('dueAt', 'desc')
      ]
    );

    // Load all meds to resolve names
    const { data: medsData } = await fetchCollection<MedHistoryDoc>(
      `users/${userId}/medications`, []
    );
    const medsMap = new Map(medsData?.map(m => [m.id, m]) || []);

    const formattedDoses = (dosesData || []).map(dose => {
      const med = medsMap.get(dose.itemId);
      return {
        ...dose,
        items: {
          name: dose.itemName || med?.name || '',
          doseText: dose.doseText || med?.doseText || ''
        }
      };
    });

    setDoses(formattedDoses);
  };

  const loadMedicationData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      // If no ID, load general history for all medications
      if (!id) {
        await loadGeneralHistory(user.uid);
        return;
      }

      const userId = user.uid;
      const profileId = activeProfile?.id;

      // Load medication info
      const { data: medData } = await fetchDocument<MedHistoryDoc>(
        `users/${userId}/medications`,
        id
      );

      setMedication(medData);

      // Load doses for selected month
      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);

      // Determine doses path
      const dosesPath = profileId
        ? `users/${userId}/profiles/${profileId}/doses`
        : `users/${userId}/doses`;

      const { data: dosesData } = await fetchCollection<DoseHistoryDoc>(
        dosesPath,
        [
          where('itemId', '==', id),
          where('dueAt', '>=', startDate.toISOString()),
          where('dueAt', '<=', endDate.toISOString()),
          orderBy('dueAt', 'desc')
        ]
      );

      // Map to match DoseTimeline expectations (Firebase already has items info usually, but let's be safe)
      const formattedDoses = (dosesData || []).map(dose => ({
        ...dose,
        items: {
          name: dose.itemName || medData?.name || '',
          doseText: dose.doseText || medData?.doseText || ''
        }
      }));

      setDoses(formattedDoses);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const taken = doses.filter(d => d.status === 'taken').length;
    const missed = doses.filter(d => d.status === 'missed').length;
    const skipped = doses.filter(d => d.status === 'skipped').length;
    const total = doses.length;
    const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;

    return { taken, missed, skipped, total, adherence };
  };

  const stats = calculateStats();

  // Create heatmap data for calendar
  const dosesByDate = doses.reduce((acc, dose) => {
    const date = safeDateParse(dose.dueAt).toDateString();
    if (!acc[date]) acc[date] = { taken: 0, missed: 0, total: 0 };
    acc[date].total++;
    if (dose.status === 'taken') acc[date].taken++;
    if (dose.status === 'missed') acc[date].missed++;
    return acc;
  }, {} as Record<string, { taken: number; missed: number; total: number }>);

  const calendarLocale = language === 'pt' ? ptBR : enUS;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <Navigation />

      <main className="container max-w-4xl mx-auto px-4 pt-20 pb-8">
        <div className="mb-6">
          <Link to={id ? "/rotina" : "/medicamentos"}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('medHistory.back')}
            </Button>
          </Link>

          <h1 className="text-3xl font-bold mb-2">
            {id
              ? (medication?.name || t('common.loading'))
              : (language === 'pt' ? 'Histórico de Doses' : 'Dose History')
            }
          </h1>
          <p className="text-muted-foreground">
            {t('medHistory.subtitle')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{stats.adherence}%</p>
                <p className="text-sm text-muted-foreground">{t('medHistory.adherence')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-success">{stats.taken}</p>
                <p className="text-sm text-muted-foreground">{t('medHistory.taken')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-destructive">{stats.missed}</p>
                <p className="text-sm text-muted-foreground">{t('medHistory.forgotten')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-muted-foreground">{stats.skipped}</p>
                <p className="text-sm text-muted-foreground">{t('medHistory.skipped')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Adherence Progress */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('medHistory.adherenceProgress')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.adherence} className="h-4" />
            <p className="text-sm text-muted-foreground mt-2">
              {stats.taken} {t('history.ofDoses')} {stats.total} {t('history.dosesTaken')}
            </p>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {t('medHistory.doseCalendar')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={calendarLocale}
              className="rounded-md border"
              modifiers={{
                perfect: Object.keys(dosesByDate)
                  .filter(date => {
                    const data = dosesByDate[date];
                    return data.taken === data.total;
                  })
                  .map(date => safeDateParse(date)),
                partial: Object.keys(dosesByDate)
                  .filter(date => {
                    const data = dosesByDate[date];
                    return data.taken > 0 && data.taken < data.total;
                  })
                  .map(date => safeDateParse(date)),
                missed: Object.keys(dosesByDate)
                  .filter(date => {
                    const data = dosesByDate[date];
                    return data.missed > 0;
                  })
                  .map(date => safeDateParse(date)),
              }}
              modifiersClassNames={{
                perfect: "bg-success/20 text-success font-bold",
                partial: "bg-warning/20 text-warning",
                missed: "bg-destructive/20 text-destructive",
              }}
            />
          </CardContent>
        </Card>

        {/* Dose Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>{t('medHistory.detailedHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">{t('medHistory.loading')}</p>
            ) : doses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t('medHistory.noDosesInPeriod')}
              </p>
            ) : (
              <DoseTimeline doses={doses} period="month" />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}