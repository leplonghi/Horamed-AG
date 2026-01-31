import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchCollection, orderBy } from "@/integrations/firebase";
import { useAuth } from "@/integrations/firebase/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, Plus, ArrowLeft, TrendingDown, TrendingUp, Minus, Pill, Leaf, Info } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import WeightRegistrationModal from "@/components/WeightRegistrationModal";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
import { useWeightInsights, MedicationMarker } from "@/hooks/useWeightInsights";
import { motion } from "framer-motion";

interface WeightLog {
  id: string;
  weightKg: number | string;
  recordedAt: string;
  notes?: string;
}

export default function WeightHistory() {
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get("profile");
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const dateLocale = language === 'pt' ? ptBR : enUS;

  const { data: weightLogs, refetch } = useQuery({
    queryKey: ["weight-history", user?.uid, profileId],
    queryFn: async () => {
      if (!user) return [];

      const collectionPath = profileId
        ? `users/${user.uid}/profiles/${profileId}/weightLogs`
        : `users/${user.uid}/weightLogs`;

      const { data, error } = await fetchCollection<WeightLog>(
        collectionPath,
        [orderBy("recordedAt", "desc")]
      );

      if (error) throw error;
      return data;
    },
    enabled: !!user?.uid,
  });

  const { data: insightsData } = useWeightInsights(profileId || undefined);

  // Transform data for chart with medication markers
  const chartData = weightLogs
    ?.slice()
    .reverse()
    .map((log) => ({
      date: format(new Date(log.recordedAt), "dd/MM", { locale: dateLocale }),
      fullDate: log.recordedAt,
      weight: typeof log.weightKg === 'string' ? parseFloat(log.weightKg) : log.weightKg,
    }));

  // Find medication start dates within chart range
  const getMedicationMarkersInRange = () => {
    if (!chartData || chartData.length === 0 || !insightsData?.medicationMarkers) return [];

    const firstDate = new Date(chartData[0].fullDate);
    const lastDate = new Date(chartData[chartData.length - 1].fullDate);

    return insightsData.medicationMarkers.filter((marker: MedicationMarker) => {
      const markerDate = new Date(marker.startDate);
      return markerDate >= firstDate && markerDate <= lastDate;
    }).map((marker: MedicationMarker) => ({
      ...marker,
      formattedDate: format(new Date(marker.startDate), "dd/MM", { locale: dateLocale })
    }));
  };

  const medicationMarkersInRange = getMedicationMarkersInRange();

  // Neutral trend analysis
  const getWeightObservation = () => {
    if (!weightLogs || weightLogs.length < 2) return null;

    const latest = typeof weightLogs[0].weightKg === 'string'
      ? parseFloat(weightLogs[0].weightKg)
      : weightLogs[0].weightKg;
    const previous = typeof weightLogs[1].weightKg === 'string'
      ? parseFloat(weightLogs[1].weightKg)
      : weightLogs[1].weightKg;
    const diff = latest - previous;

    if (Math.abs(diff) < 0.3) {
      return {
        text: language === 'pt' ? 'Peso estável' : 'Weight stable',
        icon: Minus,
        value: language === 'pt' ? 'Manteve' : 'Stable'
      };
    }

    return {
      text: language === 'pt' ? 'Variação observada' : 'Variation observed',
      icon: diff > 0 ? TrendingUp : TrendingDown,
      value: diff > 0 ? `+${diff.toFixed(1)} kg` : `${diff.toFixed(1)} kg`
    };
  };

  const observation = getWeightObservation();

  // Calculate days since last log for frequency guidance
  const daysSinceLastLog = weightLogs && weightLogs.length > 0
    ? differenceInDays(new Date(), new Date(weightLogs[0].recordedAt))
    : null;

  const showFrequencyReminder = daysSinceLastLog !== null && daysSinceLastLog > 7;

  return (
    <div className="min-h-screen flex flex-col pb-20 bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1 container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader
            title={language === 'pt' ? "Indicadores de Saúde" : "Health Indicators"}
            description={language === 'pt'
              ? "Acompanhe a evolução do seu peso ao longo do tempo"
              : "Track your weight evolution over time"}
            icon={<Scale className="h-6 w-6 text-primary" />}
          />
        </div>

        {/* Frequency Guidance Banner */}
        {showFrequencyReminder && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-primary/5 border border-primary/20"
          >
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {language === 'pt' ? 'Registro semanal recomendado' : 'Weekly logging recommended'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'pt'
                    ? 'Para acompanhar tendências, o ideal é registrar o peso uma vez por semana. Registros muito frequentes podem confundir a leitura.'
                    : 'To track trends, we recommend logging your weight once a week. Too frequent logs may confuse the analysis.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Summary Card - Neutral tone */}
        {weightLogs && weightLogs.length > 0 && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {language === 'pt' ? 'Resumo' : 'Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {weightLogs[0].weightKg}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'pt' ? 'Peso atual (kg)' : 'Current (kg)'}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{weightLogs.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'pt' ? 'Registros' : 'Records'}
                  </p>
                </div>
                {observation && (
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <observation.icon className="h-5 w-5 text-primary" />
                      <p className="text-lg font-bold text-primary">{observation.value}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{observation.text}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chart Card with Medication Markers */}
        {chartData && chartData.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'pt' ? 'Evolução' : 'Evolution'}</CardTitle>
              <CardDescription>
                {language === 'pt' ? 'Peso ao longo do tempo' : 'Weight over time'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={["dataMin - 2", "dataMax + 2"]}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number | string) => [`${value} kg`, language === 'pt' ? 'Peso' : 'Weight']}
                  />

                  {/* Medication start markers */}
                  {medicationMarkersInRange.map((marker: MedicationMarker & { formattedDate: string }, idx: number) => (
                    <ReferenceLine
                      key={marker.id}
                      x={marker.formattedDate}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: marker.type === 'supplement' ? '🌿' : '💊',
                        position: 'top',
                        fontSize: 14
                      }}
                    />
                  ))}

                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Medication markers legend */}
              {medicationMarkersInRange.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    {language === 'pt' ? 'Marcos no gráfico:' : 'Timeline markers:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {medicationMarkersInRange.map((marker: MedicationMarker & { formattedDate: string }) => (
                      <div
                        key={marker.id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs"
                      >
                        {marker.type === 'supplement' ? (
                          <Leaf className="h-3 w-3 text-green-600" />
                        ) : (
                          <Pill className="h-3 w-3 text-primary" />
                        )}
                        <span className="text-muted-foreground">{marker.name}</span>
                        <span className="text-muted-foreground/60">({marker.formattedDate})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Insights Card */}
        {insightsData && insightsData.insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {language === 'pt' ? 'Observações' : 'Observations'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insightsData.insights.slice(0, 3).map((insight, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                      {insight.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-primary" />
                      ) : insight.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-primary" />
                      ) : (
                        <Minus className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                    </div>
                    {insight.value && (
                      <span className="text-sm font-bold text-primary shrink-0">
                        {insight.value}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Button */}
        <Button
          className="w-full gap-2 h-12 text-base"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-5 w-5" />
          {language === 'pt' ? 'Registrar peso' : 'Log weight'}
        </Button>

        {/* History List */}
        <Card>
          <CardHeader>
            <CardTitle>{language === 'pt' ? 'Histórico' : 'History'}</CardTitle>
            <CardDescription>
              {weightLogs?.length || 0} {weightLogs?.length === 1
                ? (language === 'pt' ? 'registro' : 'record')
                : (language === 'pt' ? 'registros' : 'records')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weightLogs && weightLogs.length > 0 ? (
              <div className="space-y-3">
                {weightLogs.map((log, index) => {
                  const prevWeight = weightLogs[index + 1]?.weightKg;
                  const currentWeight = typeof log.weightKg === 'string' ? parseFloat(log.weightKg) : log.weightKg;
                  const previousWeight = prevWeight && typeof prevWeight === 'string' ? parseFloat(prevWeight) : prevWeight;
                  const diff = previousWeight ? currentWeight - previousWeight : null;

                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-primary">
                            {log.weightKg} <span className="text-sm font-normal">kg</span>
                          </p>
                          {diff !== null && Math.abs(diff) >= 0.1 && (
                            <span className="text-sm font-medium text-muted-foreground">
                              {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} kg
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(log.recordedAt),
                            language === 'pt' ? "dd 'de' MMMM 'de' yyyy" : "MMMM dd, yyyy",
                            { locale: dateLocale }
                          )}
                        </p>
                        {log.notes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            "{log.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  {language === 'pt' ? 'Nenhum registro ainda' : 'No records yet'}
                </p>
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'pt' ? 'Registrar primeiro peso' : 'Log first weight'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <WeightRegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        profileId={profileId || undefined}
        onSuccess={refetch}
      />
    </div>
  );
}
