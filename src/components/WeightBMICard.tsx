import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, Plus, TrendingUp, TrendingDown, Info, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import WeightRegistrationModal from "./WeightRegistrationModal";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { auth, fetchCollection, fetchDocument, orderBy, limit, where } from "@/integrations/firebase";

interface WeightBMICardProps {
  userId: string;
  profileId?: string;
}

export default function WeightBMICard({ userId, profileId }: WeightBMICardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Get user height for BMI calculation
  const { data: profileData } = useQuery({
    queryKey: ["profile-height", userId, profileId],
    queryFn: async () => {
      // If profileId provided, fetch that profile. Else fetch primary?
      // Supabase code used: .from("profiles").eq("user_id", userId).maybeSingle()
      // This implies it fetched ANY profile or just the first one?
      // In Firebase: users/{uid}/profiles/{profileId} if profileId exists.
      // If not, we might check local storage or fetch 'isPrimary=true'.

      let heightCm = null;
      if (profileId) {
        const { data } = await fetchDocument<any>(`users/${userId}/profiles`, profileId);
        heightCm = data?.heightCm;
      } else {
        // Fallback to searching primary
        const { data } = await fetchCollection<any>(
          `users/${userId}/profiles`,
          [where('isPrimary', '==', true), limit(1)]
        );
        if (data && data.length > 0) heightCm = data[0].heightCm;
      }
      return { height_cm: heightCm };
    },
    enabled: !!userId
  });

  // Get latest weight
  const { data: latestWeight, refetch } = useQuery({
    queryKey: ["latest-weight", userId, profileId],
    queryFn: async () => {
      // Fetch vitalSigns ordered by date, filter for weight
      // Limit 10 to hope we find one with weight
      const { data } = await fetchCollection<any>(
        `users/${userId}/vitalSigns`,
        [orderBy('measuredAt', 'desc'), limit(20)]
      );

      if (!data) return null;

      const log = data.find((v: any) =>
        v.weightKg && (profileId ? v.profileId === profileId : true)
      );

      if (!log) return null;

      return {
        weight_kg: log.weightKg,
        recorded_at: log.measuredAt
      };
    },
    enabled: !!userId
  });

  // Get last 6 months of weight data for chart
  const { data: weightHistory } = useQuery({
    queryKey: ["weight-chart", userId, profileId],
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 6);

      // Fetch vitalSigns
      const { data } = await fetchCollection<any>(
        `users/${userId}/vitalSigns`,
        [
          where('measuredAt', '>=', sixMonthsAgo.toISOString()),
          orderBy('measuredAt', 'asc')
        ]
      );

      if (!data) return [];

      const logs = data.filter((v: any) =>
        v.weightKg && (profileId ? v.profileId === profileId : true)
      );

      return logs.map((log: any) => ({
        weight: log.weightKg,
        date: new Date(log.measuredAt),
        dateLabel: format(new Date(log.measuredAt), "dd/MM/yy"),
        fullDate: format(new Date(log.measuredAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
      }));
    },
    enabled: !!userId
  });

  const calculateBMI = () => {
    if (!latestWeight || !profileData?.height_cm) return null;
    const heightM = profileData.height_cm / 100;
    const weightNum = typeof latestWeight.weight_kg === 'string'
      ? parseFloat(latestWeight.weight_kg)
      : latestWeight.weight_kg;
    const bmi = weightNum / (heightM * heightM);
    return bmi.toFixed(1);
  };

  const getBMIDescription = (bmiStr: string) => {
    const bmi = parseFloat(bmiStr);
    if (bmi < 18.5) return {
      text: "abaixo do peso",
      color: "text-blue-600",
      description: "Pode indicar desnutrição ou perda de massa muscular",
      recommendation: "Considere consultar um nutricionista para orientação adequada"
    };
    if (bmi < 25) return {
      text: "peso normal",
      color: "text-green-600",
      description: "Faixa considerada saudável pela OMS",
      recommendation: "Continue mantendo hábitos saudáveis de alimentação e exercícios"
    };
    if (bmi < 30) return {
      text: "sobrepeso",
      color: "text-yellow-600",
      description: "Acima do peso ideal, mas ainda não obesidade",
      recommendation: "Atenção à alimentação e atividade física pode ajudar"
    };
    return {
      text: "obesidade",
      color: "text-red-600",
      description: "Pode aumentar riscos de problemas de saúde",
      recommendation: "Importante acompanhamento médico e nutricional"
    };
  };

  const bmi = calculateBMI();
  const bmiDesc = bmi ? getBMIDescription(bmi) : null;

  const getTrend = () => {
    if (!weightHistory || weightHistory.length < 2) return null;
    const latest = weightHistory[weightHistory.length - 1].weight;
    const previous = weightHistory[weightHistory.length - 2].weight;
    const diff = latest - previous;
    return diff;
  };

  const getMonthlyComparison = () => {
    if (!weightHistory || weightHistory.length < 2) return null;

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const currentMonthWeights = weightHistory.filter((log: any) =>
      log.date >= currentMonthStart
    );
    const lastMonthWeights = weightHistory.filter((log: any) =>
      log.date >= lastMonthStart && log.date <= lastMonthEnd
    );

    if (currentMonthWeights.length === 0 || lastMonthWeights.length === 0) return null;

    const currentAvg = currentMonthWeights.reduce((sum: number, log: any) => sum + log.weight, 0) / currentMonthWeights.length;
    const lastAvg = lastMonthWeights.reduce((sum: number, log: any) => sum + log.weight, 0) / lastMonthWeights.length;
    const diff = currentAvg - lastAvg;

    return {
      currentAvg: currentAvg.toFixed(1),
      lastAvg: lastAvg.toFixed(1),
      diff: diff.toFixed(1),
      percentChange: ((diff / lastAvg) * 100).toFixed(1)
    };
  };

  const getSignificantChanges = () => {
    if (!weightHistory || weightHistory.length < 2) return [];

    const changes = [];
    const significantThreshold = 2; // kg

    for (let i = 1; i < weightHistory.length; i++) {
      const diff = weightHistory[i].weight - weightHistory[i - 1].weight;
      if (Math.abs(diff) >= significantThreshold) {
        changes.push({
          date: weightHistory[i].dateLabel,
          change: diff,
          weight: weightHistory[i].weight
        });
      }
    }

    return changes.slice(-3); // Last 3 significant changes
  };

  const getWeightRange = () => {
    if (!weightHistory || weightHistory.length === 0) return null;
    const weights = weightHistory.map((log: any) => log.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    return { min, max, range: (max - min).toFixed(1) };
  };

  const trend = getTrend();
  const monthlyComparison = getMonthlyComparison();
  const significantChanges = getSignificantChanges();
  const weightRange = getWeightRange();

  return (
    <>
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="h-5 w-5 text-primary" />
                Peso & IMC
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Acompanhamento de peso e índice de massa corporal
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setModalOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Registrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-background/60 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Peso Atual</p>
              {latestWeight ? (
                <>
                  <p className="text-4xl font-bold text-primary">
                    {latestWeight.weight_kg}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">kg</p>
                  {trend !== null && (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {trend > 0 ? (
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                      ) : trend < 0 ? (
                        <TrendingDown className="h-4 w-4 text-green-600" />
                      ) : null}
                      <span
                        className={`text-sm font-medium ${trend > 0
                            ? "text-orange-600"
                            : trend < 0
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }`}
                      >
                        {trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1)} kg
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4">Não registrado</p>
              )}
            </div>

            <div className="text-center p-4 bg-background/60 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">IMC</p>
                <button
                  onClick={() => setInfoOpen(!infoOpen)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Informações sobre IMC"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              {bmi && bmiDesc ? (
                <>
                  <p className="text-4xl font-bold">{bmi}</p>
                  <p className={`text-sm font-medium mt-2 ${bmiDesc.color}`}>
                    {bmiDesc.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bmiDesc.description}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  {!profileData?.height_cm ? "Informe sua altura" : "Registre seu peso"}
                </p>
              )}
            </div>
          </div>

          {weightHistory && weightHistory.length > 1 && (
            <div className="space-y-4">
              {/* Monthly Comparison */}
              {monthlyComparison && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Média este mês</p>
                    <p className="text-2xl font-bold text-primary">{monthlyComparison.currentAvg} kg</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">vs. mês anterior</p>
                    <div className="flex items-center gap-2">
                      {parseFloat(monthlyComparison.diff) > 0 ? (
                        <>
                          <TrendingUp className="h-5 w-5 text-orange-600" />
                          <span className="text-2xl font-bold text-orange-600">+{monthlyComparison.diff}</span>
                        </>
                      ) : parseFloat(monthlyComparison.diff) < 0 ? (
                        <>
                          <TrendingDown className="h-5 w-5 text-green-600" />
                          <span className="text-2xl font-bold text-green-600">{monthlyComparison.diff}</span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-5 w-5 text-muted-foreground" />
                          <span className="text-2xl font-bold text-muted-foreground">0.0</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthlyComparison.percentChange}% {parseFloat(monthlyComparison.diff) >= 0 ? 'de aumento' : 'de redução'}
                    </p>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightHistory} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickMargin={5}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return `Registrado em: ${payload[0].payload.fullDate}`;
                        }
                        return `Data: ${label}`;
                      }}
                    />
                    {latestWeight && (
                      <ReferenceLine
                        y={typeof latestWeight.weight_kg === 'string' ? parseFloat(latestWeight.weight_kg) : latestWeight.weight_kg}
                        stroke="hsl(var(--primary))"
                        strokeDasharray="3 3"
                        label={{ value: 'Atual', position: 'right', fontSize: 10, fill: 'hsl(var(--primary))' }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                      activeDot={{ r: 7, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Evolução dos últimos 6 meses • Pontos marcam datas reais de registro
                </p>
              </div>

              {/* Weight Range */}
              {weightRange && (
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-muted-foreground">Peso mínimo:</span>
                      <span className="font-semibold ml-1">{weightRange.min} kg</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Variação:</span>
                      <span className="font-semibold ml-1">{weightRange.range} kg</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Peso máximo:</span>
                      <span className="font-semibold ml-1">{weightRange.max} kg</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Significant Changes */}
              {significantChanges.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    Mudanças significativas (≥ 2 kg)
                  </h4>
                  <div className="space-y-2">
                    {significantChanges.map((change, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded border">
                        <div className="flex items-center gap-2">
                          {change.change > 0 ? (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              +{change.change.toFixed(1)} kg
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              {change.change.toFixed(1)} kg
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{change.date}</span>
                        </div>
                        <span className="text-sm font-semibold">{change.weight} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Registrations */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Todos os registros</h4>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
                  {weightHistory.slice().reverse().map((log: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/20 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">{log.fullDate}</span>
                      </div>
                      <span className="font-semibold">{log.weight} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
            <CollapsibleContent className="mt-4 space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-1">O que é IMC?</h4>
                  <p className="text-xs text-muted-foreground">
                    O Índice de Massa Corporal (IMC) é uma medida internacional usada para identificar se uma pessoa está no peso ideal. É calculado dividindo o peso (kg) pela altura ao quadrado (m²).
                  </p>
                </div>
                {/* ... existing static content ... */}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <WeightRegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        profileId={profileId}
        onSuccess={refetch}
      />
    </>
  );
}
