import { useState, useEffect } from "react";
import { auth, fetchCollection, where, orderBy } from "@/integrations/firebase";
import { useNavigate } from "react-router-dom";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heartbeat as Activity, TrendUp as TrendingUp, WarningCircle as AlertCircle, Target, CalendarBlank as Calendar, FileText, CheckCircle as CheckCircle2, Clock, Heart, Footprints, Moon, Gauge, Plus, ShareNetwork as Share2, Pill } from "@phosphor-icons/react";
import { format, subMonths, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/LanguageContext";
import { safeDateParse } from "@/lib/safeDateUtils";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Area,
  Bar,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line
} from "recharts";
import HealthToolsGrid from "@/components/health/HealthToolsGrid";
import PageHeroHeader from "@/components/shared/PageHeroHeader";

interface AdherenceData {
  data: string;
  taxa: number;
  total: number;
  tomadas: number;
}

interface PeriodComparison {
  mesAtual: { adesao: number; dosesTomadas: number; dosesTotal: number; medicamentos: number };
  mesAnterior: { adesao: number; dosesTomadas: number; dosesTotal: number; medicamentos: number };
  tendencias: { adesao: "up" | "down" | "stable"; doses: "up" | "down" | "stable"; medicamentos: "up" | "down" | "stable" };
  variacoes: { adesao: number; doses: number; medicamentos: number };
}

// Circular Progress Component
function CircularProgress({ value, size = 120, strokeWidth = 10 }: {
  value: number; size?: number; strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const id = "grad-tab-" + Math.round(value);

  return (
    <div className="relative flex items-center justify-center mx-auto sm:mx-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/10" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={`url(#${id})`} strokeWidth={strokeWidth} strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "circOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black tracking-tighter" style={{ color: "hsl(var(--primary))" }}>{Math.round(value)}%</span>
        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-70">Adesão</span>
      </div>
    </div>
  );
}

export default function HealthDataTab({ hideLayout = false }: { hideLayout?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeProfile } = useUserProfiles();
  const [loading, setLoading] = useState(true);
  const [pesoData, setPesoData] = useState<{ data: string; peso: number }[]>([]);
  const [pressaoData, setPressaoData] = useState<{ data: string; sistolica: number; diastolica: number }[]>([]);
  const [glicemiaData, setGlicemiaData] = useState<{ data: string; glicemia: number }[]>([]);
  const [adherenceData, setAdherenceData] = useState<AdherenceData[]>([]);
  const [stats, setStats] = useState({
    medicamentosAtivos: 0,
    taxaAdesao: 0,
    proximosEventos: 0,
    documentosVencendo: 0,
    lastWeight: null as number | null,
    lastBP: null as string | null,
    lastGlucose: null as number | null,
  });
  const [periodComparison, setPeriodComparison] = useState<PeriodComparison | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [activeProfile?.id]);

  const loadDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const threeMonthsAgo = subMonths(new Date(), 3);
      const thirtyDaysAgo = subDays(new Date(), 30);
      const hoje = new Date().toISOString().split("T")[0];

      // Active medications
      const { data: allActiveMeds } = await fetchCollection<Record<string, unknown>>(
        `users/${user.uid}/medications`,
        [where("isActive", "==", true)]
      );
      const activeMeds = activeProfile
        ? allActiveMeds?.filter((m: Record<string, unknown>) => m.profileId === activeProfile.id)
        : allActiveMeds;

      // Adherence (30 days)
      const { data: recentDoses } = await fetchCollection<Record<string, unknown>>(
        "dose_instances",
        [where("dueAt", ">=", thirtyDaysAgo)]
      );
      const { data: allItems } = await fetchCollection<Record<string, unknown>>(`users/${user.uid}/medications`);
      const itemProfileMap = new Map(allItems?.map((i: Record<string, unknown>) => [i.id, i.profileId]));
      const filteredRecentDoses = activeProfile
        ? recentDoses?.filter((d: Record<string, unknown>) => itemProfileMap.get(d.itemId as string) === activeProfile.id)
        : recentDoses;

      const totalDoses = filteredRecentDoses?.length || 0;
      const takenDoses = filteredRecentDoses?.filter((d: Record<string, unknown>) => d.status === "taken").length || 0;
      const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

      // Upcoming events
      const { data: upcomingConsultas } = await fetchCollection<Record<string, unknown>>(
        `users/${user.uid}/appointments`,
        [where("date", ">=", hoje)]
      );
      const filteredConsultas = activeProfile
        ? upcomingConsultas?.filter((c: Record<string, unknown>) => c.profileId === activeProfile.id)
        : upcomingConsultas;

      // Expiring docs
      const em30Dias = new Date();
      em30Dias.setDate(em30Dias.getDate() + 30);
      const { data: expiringDocs } = await fetchCollection<Record<string, unknown>>(
        `users/${user.uid}/documents`,
        [where("expiresAt", ">=", hoje), where("expiresAt", "<=", em30Dias.toISOString().split("T")[0])]
      );
      const filteredExpiringDocs = activeProfile
        ? expiringDocs?.filter((d: Record<string, unknown>) => d.profileId === activeProfile.id)
        : expiringDocs;

      // Vitals
      const { data: sinais } = await fetchCollection<Record<string, unknown>>(
        `users/${user.uid}/vitals`,
        [where("date", ">=", threeMonthsAgo), orderBy("date", "asc")]
      );
      const filteredSinais = activeProfile
        ? sinais?.filter((s: Record<string, unknown>) => s.profileId === activeProfile.id)
        : sinais;

      const peso = filteredSinais?.filter((s: Record<string, unknown>) => s.weightKg)
        .map((s: Record<string, unknown>) => ({
          data: format(safeDateParse(s.date as string), "dd/MMM", { locale: ptBR }),
          peso: parseFloat(String(s.weightKg))
        })) || [];
      setPesoData(peso);

      const pressao = filteredSinais?.filter((s: Record<string, unknown>) => s.systolicBP)
        .map((s: Record<string, unknown>) => ({
          data: format(safeDateParse(s.date as string), "dd/MMM", { locale: ptBR }),
          sistolica: s.systolicBP as number,
          diastolica: s.diastolicBP as number
        })) || [];
      setPressaoData(pressao);

      const glicemia = filteredSinais?.filter((s: Record<string, unknown>) => s.glucose)
        .map((s: Record<string, unknown>) => ({
          data: format(safeDateParse(s.date as string), "dd/MMM", { locale: ptBR }),
          glicemia: s.glucose as number
        })) || [];
      setGlicemiaData(glicemia);

      // Latest vitals for grid
      const lastVital = filteredSinais?.[filteredSinais.length - 1];
      const lastWeight = lastVital?.weightKg ? parseFloat(String(lastVital.weightKg)) : null;
      const lastBP = lastVital?.systolicBP ? `${lastVital.systolicBP}/${lastVital.diastolicBP}` : null;
      const lastGlucose = lastVital?.glucose ? (lastVital.glucose as number) : null;

      setStats({
        medicamentosAtivos: activeMeds?.length || 0,
        taxaAdesao: adherenceRate,
        proximosEventos: filteredConsultas?.length || 0,
        documentosVencendo: filteredExpiringDocs?.length || 0,
        lastWeight,
        lastBP,
        lastGlucose,
      });

      // Adherence by day
      const last30Days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
      const adherenceByDay: AdherenceData[] = last30Days.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayDoses = filteredRecentDoses?.filter((d: Record<string, unknown>) =>
          format(safeDateParse(d.dueAt as string), "yyyy-MM-dd") === dayStr
        ) || [];
        const total = dayDoses.length;
        const taken = dayDoses.filter((d: Record<string, unknown>) => d.status === "taken").length;
        return {
          data: format(day, "dd/MMM", { locale: ptBR }),
          taxa: total > 0 ? Math.round((taken / total) * 100) : 0,
          total,
          tomadas: taken
        };
      });
      setAdherenceData(adherenceByDay);

      // Period comparison
      const mesAtualInicio = startOfMonth(new Date());
      const mesAtualFim = endOfMonth(new Date());
      const mesAnteriorInicio = startOfMonth(subMonths(new Date(), 1));
      const mesAnteriorFim = endOfMonth(subMonths(new Date(), 1));

      const { data: periodDoses } = await fetchCollection<Record<string, unknown>>(
        "dose_instances",
        [where("dueAt", ">=", mesAnteriorInicio), where("dueAt", "<=", mesAtualFim)]
      );
      const filteredPeriodDoses = activeProfile
        ? periodDoses?.filter((d: Record<string, unknown>) => itemProfileMap.get(d.itemId as string) === activeProfile.id)
        : periodDoses;

      const dosesCurrentMonth = filteredPeriodDoses?.filter((d: Record<string, unknown>) =>
        safeDateParse(d.dueAt as string) >= mesAtualInicio && safeDateParse(d.dueAt as string) <= mesAtualFim
      ) || [];
      const dosesPreviousMonth = filteredPeriodDoses?.filter((d: Record<string, unknown>) =>
        safeDateParse(d.dueAt as string) >= mesAnteriorInicio && safeDateParse(d.dueAt as string) <= mesAnteriorFim
      ) || [];

      const tc = dosesCurrentMonth.length;
      const tkc = dosesCurrentMonth.filter((d: Record<string, unknown>) => d.status === "taken").length;
      const tp = dosesPreviousMonth.length;
      const tkp = dosesPreviousMonth.filter((d: Record<string, unknown>) => d.status === "taken").length;
      const ac = tc > 0 ? Math.round((tkc / tc) * 100) : 0;
      const ap = tp > 0 ? Math.round((tkp / tp) * 100) : 0;
      const amc = activeMeds?.filter((m: Record<string, unknown>) => safeDateParse(m.createdAt as string) <= mesAtualFim).length || 0;
      const amp = activeMeds?.filter((m: Record<string, unknown>) => safeDateParse(m.createdAt as string) <= mesAnteriorFim).length || 0;

      const getTrend = (diff: number): "up" | "down" | "stable" =>
        diff > 2 ? "up" : diff < -2 ? "down" : "stable";

      setPeriodComparison({
        mesAtual: { adesao: ac, dosesTomadas: tkc, dosesTotal: tc, medicamentos: amc },
        mesAnterior: { adesao: ap, dosesTomadas: tkp, dosesTotal: tp, medicamentos: amp },
        tendencias: { adesao: getTrend(ac - ap), doses: getTrend(tkc - tkp), medicamentos: getTrend(amc - amp) },
        variacoes: { adesao: ac - ap, doses: tkc - tkp, medicamentos: amc - amp }
      });

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      toast.error(t("toast.health.dashboardError"));
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const vitalsGrid = [
    {
      icon: Heart, label: "Pressão", value: stats.lastBP || "—",
      unit: "mmHg", color: "text-rose-500", bg: "bg-rose-500/10",
      onClick: () => navigate("/sinais-vitais"),
    },
    {
      icon: Gauge, label: "Glicemia", value: stats.lastGlucose ?? "—",
      unit: "mg/dL", color: "text-amber-500", bg: "bg-amber-500/10",
      onClick: () => navigate("/sinais-vitais"),
    },
    {
      icon: Footprints, label: "Peso", value: stats.lastWeight ?? "—",
      unit: "kg", color: "text-emerald-500", bg: "bg-emerald-500/10",
      onClick: () => navigate("/sinais-vitais"),
    },
    {
      icon: Moon, label: "Eventos", value: stats.proximosEventos,
      unit: "agendados", color: "text-blue-500", bg: "bg-blue-500/10",
      onClick: () => navigate("/consultas"),
    },
  ];

  return (
    <div className={cn("space-y-6", !hideLayout && "container max-w-4xl mx-auto px-4 py-6")}>
      {!hideLayout && (
        <PageHeroHeader
          icon={<TrendingUp className="h-6 w-6 text-primary" />}
          title="Sinais & Dados"
          subtitle={format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        />
      )}

      {/* General Activity - Circular Progress Card */}
      <motion.div variants={itemVariants} initial="hidden" animate="show">
        <Card className={cn(
          "rounded-3xl border border-border/30 shadow-[var(--shadow-glass)]",
          "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl overflow-hidden"
        )}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <CircularProgress value={stats.taxaAdesao} />
              <div className="flex-1 space-y-3 w-full">
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-bold">Atividade Geral</h3>
                  <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-primary/5 rounded-xl p-2.5">
                    <p className="text-lg font-bold">{stats.medicamentosAtivos}</p>
                    <p className="text-[10px] text-muted-foreground">Medicamentos</p>
                  </div>
                  <div className="bg-emerald-500/5 rounded-xl p-2.5">
                    <p className="text-lg font-bold">
                      {adherenceData.reduce((s, d) => s + d.tomadas, 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Doses Tomadas</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vitals 2x2 Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show"
        className="grid grid-cols-2 gap-3">
        {vitalsGrid.map((vital) => (
          <motion.div key={vital.label} variants={itemVariants}>
            <Card onClick={vital.onClick}
              className={cn(
                "rounded-3xl border border-border/30 shadow-[var(--shadow-glass)] cursor-pointer",
                "bg-card/80 backdrop-blur-xl",
                "hover:shadow-[var(--shadow-glass-hover)] hover:scale-[1.02] transition-all"
              )}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("p-2.5 rounded-2xl hidden xs:block", vital.bg)}>
                  <vital.icon className={cn("h-5 w-5", vital.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold truncate">{vital.value}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {vital.label} · {vital.unit}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Action Bar */}
      <motion.div variants={itemVariants} initial="hidden" animate="show"
        className="grid grid-cols-2 gap-3">
        <Button onClick={() => navigate("/sinais-vitais")}
          className="h-14 rounded-2xl gap-2 text-base shadow-lg">
          <Plus className="h-5 w-5" /> Dados
        </Button>
        <Button variant="outline" onClick={() => navigate("/relatorios")}
          className="h-14 rounded-2xl gap-2 text-base border-border/50 bg-card/60 backdrop-blur-sm">
          <Share2 className="h-5 w-5" /> Relatório
        </Button>
      </motion.div>

      {/* Health Tools */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Ferramentas de Saúde
        </h2>
        <HealthToolsGrid />
      </div>

      {/* Alerts */}
      {stats.taxaAdesao < 50 && (
        <Card className="rounded-3xl border-rose-200/50 bg-rose-50/50 dark:bg-rose-950/20 backdrop-blur-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-rose-900 dark:text-rose-100 text-sm">
                Atenção: Progresso Baixo ({stats.taxaAdesao}%)
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                Manter a regularidade é essencial para o tratamento.
              </p>
              <Button size="sm" variant="destructive" className="mt-2 rounded-xl"
                onClick={() => navigate("/hoje")}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Ver Doses de Hoje
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {stats.documentosVencendo > 0 && (
        <Card className="rounded-3xl border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20 backdrop-blur-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                {stats.documentosVencendo} Doc{stats.documentosVencendo > 1 ? "s" : ""} Vencendo
              </h3>
              <Button size="sm" className="mt-2 rounded-xl bg-amber-600 hover:bg-amber-700"
                onClick={() => navigate("/carteira")}>
                <FileText className="h-3.5 w-3.5 mr-1" /> Abrir Carteira
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Comparison */}
      {periodComparison && (
        <Card className={cn(
          "rounded-3xl border border-border/30 shadow-[var(--shadow-glass)]",
          "bg-gradient-to-br from-primary/5 to-card/70 backdrop-blur-xl"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Evolução Mensal
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {format(subMonths(new Date(), 1), "MMMM", { locale: ptBR })} vs {format(new Date(), "MMMM", { locale: ptBR })}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Progresso", cur: `${periodComparison.mesAtual.adesao}%`, prev: `${periodComparison.mesAnterior.adesao}%`, trend: periodComparison.tendencias.adesao, diff: periodComparison.variacoes.adesao, suffix: "%" },
                { label: "Doses", cur: String(periodComparison.mesAtual.dosesTomadas), prev: `/ ${periodComparison.mesAtual.dosesTotal}`, trend: periodComparison.tendencias.doses, diff: periodComparison.variacoes.doses, suffix: "" },
                { label: "Meds", cur: String(periodComparison.mesAtual.medicamentos), prev: "ativos", trend: periodComparison.tendencias.medicamentos, diff: periodComparison.variacoes.medicamentos, suffix: "" },
              ].map((item) => (
                <div key={item.label} className="bg-background/60 rounded-2xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
                    {item.trend === "up" && <Badge className="bg-emerald-500 text-[9px] px-1 py-0">↑{Math.abs(item.diff)}{item.suffix}</Badge>}
                    {item.trend === "down" && <Badge variant="destructive" className="text-[9px] px-1 py-0">↓{Math.abs(item.diff)}{item.suffix}</Badge>}
                    {item.trend === "stable" && <Badge variant="secondary" className="text-[9px] px-1 py-0">—</Badge>}
                  </div>
                  <p className="text-xl font-bold">{item.cur}</p>
                  <p className="text-[10px] text-muted-foreground">{item.prev}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adherence Chart */}
      {adherenceData.length > 0 && (
        <Card className="rounded-3xl border border-border/30 shadow-[var(--shadow-glass)] bg-card/80 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Adesão (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={adherenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="data" tick={{ fontSize: 10 }} interval={4} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 16, fontSize: 12, border: "1px solid hsl(var(--border))" }} />
                <Area yAxisId="left" type="monotone" dataKey="taxa" fill="hsl(var(--primary))"
                  fillOpacity={0.15} stroke="hsl(var(--primary))" strokeWidth={2} name="Progresso (%)" />
                <Bar yAxisId="right" dataKey="tomadas" fill="#22c55e" name="Tomadas" opacity={0.5} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Vitals Charts */}
      {(pesoData.length > 0 || pressaoData.length > 0 || glicemiaData.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sinais Vitais</h2>
            <Button variant="ghost" size="sm" className="rounded-xl text-xs h-8" onClick={() => navigate("/sinais-vitais")}>
              <Activity className="h-3.5 w-3.5 mr-1" /> Registrar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pesoData.length > 0 && (
              <Card className="rounded-3xl border border-border/30 shadow-[var(--shadow-glass)] bg-card/80 backdrop-blur-xl">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Footprints className="h-4 w-4 text-emerald-500" /> Peso
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ResponsiveContainer width="100%" height={180}>
                    <RechartsLineChart data={pesoData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="data" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                      <Line type="monotone" dataKey="peso" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {pressaoData.length > 0 && (
              <Card className="rounded-3xl border border-border/30 shadow-[var(--shadow-glass)] bg-card/80 backdrop-blur-xl">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-500" /> Pressão Arterial
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ResponsiveContainer width="100%" height={180}>
                    <RechartsLineChart data={pressaoData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="data" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="sistolica" stroke="#ef4444" strokeWidth={2} name="Sistólica" />
                      <Line type="monotone" dataKey="diastolica" stroke="#3b82f6" strokeWidth={2} name="Diastólica" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {glicemiaData.length > 0 && (
              <Card className="rounded-3xl border border-border/30 shadow-[var(--shadow-glass)] bg-card/80 backdrop-blur-xl">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-amber-500" /> Glicemia
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ResponsiveContainer width="100%" height={180}>
                    <RechartsLineChart data={glicemiaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="data" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                      <Line type="monotone" dataKey="glicemia" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pesoData.length === 0 && pressaoData.length === 0 && glicemiaData.length === 0 && adherenceData.length === 0 && (
        <Card className="rounded-3xl border border-border/30 shadow-[var(--shadow-glass)] bg-card/80 backdrop-blur-xl">
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Comece a usar o app para ver insights</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              À medida que registrar doses e sinais vitais, esta página trará correlações entre adesão e saúde.
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button className="rounded-2xl" onClick={() => navigate("/hoje")}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Registrar Doses
              </Button>
              <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/sinais-vitais")}>
                <Activity className="h-4 w-4 mr-1.5" /> Sinais Vitais
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card className={cn(
        "rounded-3xl border border-border/30 shadow-[var(--shadow-glass)]",
        "bg-card/60 backdrop-blur-xl"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Explore Mais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Clock, label: "Histórico", sub: "Ver doses", path: "/historico" },
              { icon: Calendar, label: "Timeline", sub: "Linha do tempo", path: "/linha-do-tempo" },
              { icon: FileText, label: "Relatórios", sub: "Gerar PDF", path: "/relatorios" },
            ].map((link) => (
              <Button key={link.path} variant="outline"
                className="h-auto py-3 flex-col gap-1.5 rounded-2xl border-border/30"
                onClick={() => navigate(link.path)}>
                <link.icon className="h-4 w-4 text-primary" />
                <span className="font-semibold text-xs">{link.label}</span>
                <span className="text-[9px] text-muted-foreground">{link.sub}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
