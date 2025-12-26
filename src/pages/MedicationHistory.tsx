import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import DoseTimeline from "@/components/DoseTimeline";
import { ArrowLeft, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { startOfMonth, endOfMonth } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MedicationHistory() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [medication, setMedication] = useState<any>(null);
  const [doses, setDoses] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedicationData();
  }, [id, selectedDate]);

  const loadMedicationData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) return;

      // Load medication info
      const { data: medData } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      setMedication(medData);

      // Load doses for selected month
      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);

      const { data: dosesData } = await supabase
        .from('dose_instances')
        .select(`
          id,
          item_id,
          due_at,
          status,
          taken_at,
          items!inner(
            name,
            dose_text
          )
        `)
        .eq('item_id', id)
        .gte('due_at', startDate.toISOString())
        .lte('due_at', endDate.toISOString())
        .order('due_at', { ascending: false });

      setDoses(dosesData || []);
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
    const date = new Date(dose.due_at).toDateString();
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
          <Link to="/doses">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('medHistory.back')}
            </Button>
          </Link>

          <h1 className="text-3xl font-bold mb-2">
            {medication?.name || t('common.loading')}
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
                  .map(date => new Date(date)),
                partial: Object.keys(dosesByDate)
                  .filter(date => {
                    const data = dosesByDate[date];
                    return data.taken > 0 && data.taken < data.total;
                  })
                  .map(date => new Date(date)),
                missed: Object.keys(dosesByDate)
                  .filter(date => {
                    const data = dosesByDate[date];
                    return data.missed > 0;
                  })
                  .map(date => new Date(date)),
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