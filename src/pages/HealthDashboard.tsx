import { useState, useEffect } from "react";
import { auth, fetchCollection, where, orderBy, limit } from "@/integrations/firebase";
import { useNavigate } from "react-router-dom";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import Header from "@/components/Header";
import HealthToolsGrid from "@/components/health/HealthToolsGrid";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  LineChart,
  Pill,
  Target,
  Calendar,
  FileText,
  CheckCircle2,
  Clock
} from "lucide-react";
import { format, subMonths, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
import { useTranslation } from "@/contexts/LanguageContext";
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  ComposedChart,
  Area
} from 'recharts';

interface ExamValue {
  parametro: string;
  valor: number;
  data: string;
  status: string;
  referencia_min?: number;
  referencia_max?: number;
}

interface AdherenceData {
  data: string;
  taxa: number;
  total: number;
  tomadas: number;
}

interface CorrelationData {
  data: string;
  adesao: number;
  peso?: number;
  pressao?: number;
  glicemia?: number;
}

interface PeriodComparison {
  mesAtual: {
    adesao: number;
    dosesTomadas: number;
    dosesTotal: number;
    medicamentos: number;
  };
  mesAnterior: {
    adesao: number;
    dosesTomadas: number;
    dosesTotal: number;
    medicamentos: number;
  };
  tendencias: {
    adesao: 'up' | 'down' | 'stable';
    doses: 'up' | 'down' | 'stable';
    medicamentos: 'up' | 'down' | 'stable';
  };
  variacoes: {
    adesao: number;
    doses: number;
    medicamentos: number;
  };
}

export default function HealthDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeProfile } = useUserProfiles();
  const [loading, setLoading] = useState(true);
  const [pesoData, setPesoData] = useState<any[]>([]);
  const [pressaoData, setPressaoData] = useState<any[]>([]);
  const [glicemiaData, setGlicemiaData] = useState<any[]>([]);
  const [examesAlterados, setExamesAlterados] = useState<ExamValue[]>([]);
  const [adherenceData, setAdherenceData] = useState<AdherenceData[]>([]);
  const [correlationData, setCorrelationData] = useState<CorrelationData[]>([]);
  const [stats, setStats] = useState({
    medicamentosAtivos: 0,
    taxaAdesao: 0,
    proximosEventos: 0,
    documentosVencendo: 0
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

      // === ESTATÍSTICAS PRINCIPAIS ===

      // Medicamentos ativos
      // We need to filter by profile_id and is_active in memory or simple query
      // Firestore doesn't support complex logical OR/AND combined easily without composite indexes for everything.
      // We'll fetch all active items and filter in code for profile.
      const { data: allActiveMeds } = await fetchCollection<any>(
        `users/${user.uid}/medications`,
        [where("isActive", "==", true)]
      );

      const activeMeds = activeProfile
        ? allActiveMeds?.filter(m => m.profileId === activeProfile.id)
        : allActiveMeds;

      const activeMedsCount = activeMeds?.length || 0;

      // Taxa de adesão nos últimos 30 dias
      const { data: recentDoses } = await fetchCollection<any>(
        `users/${user.uid}/doses`,
        [where("dueAt", ">=", thirtyDaysAgo.toISOString())]
      );

      // Need to join with items to filter by profile if needed.
      // We will need to fetch all items to map itemID -> profileId
      const { data: allItems } = await fetchCollection<any>(`users/${user.uid}/medications`);
      const itemProfileMap = new Map(allItems?.map(i => [i.id, i.profileId]));

      const filteredRecentDoses = activeProfile
        ? recentDoses?.filter(d => itemProfileMap.get(d.itemId) === activeProfile.id)
        : recentDoses;

      const totalDoses = filteredRecentDoses?.length || 0;
      const takenDoses = filteredRecentDoses?.filter(d => d.status === "taken").length || 0;
      const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

      // Próximos eventos (consultas + eventos de saúde)
      // Appointments
      const { data: upcomingConsultas } = await fetchCollection<any>(
        `users/${user.uid}/appointments`,
        [where("date", ">=", hoje)] // Assuming field is 'date'
      );
      const filteredConsultas = activeProfile
        ? upcomingConsultas?.filter(c => c.profileId === activeProfile.id)
        : upcomingConsultas;

      // Health Events (assuming collection 'healthEvents')
      const { data: upcomingEventos } = await fetchCollection<any>(
        `users/${user.uid}/healthEvents`,
        [where("dueDate", ">=", hoje), where("completedAt", "==", null)]
      );
      const filteredEventos = activeProfile
        ? upcomingEventos?.filter(e => e.profileId === activeProfile.id)
        : upcomingEventos;

      const upcomingEventsCount = (filteredConsultas?.length || 0) + (filteredEventos?.length || 0);

      // Documentos vencendo em 30 dias
      const em30Dias = new Date();
      em30Dias.setDate(em30Dias.getDate() + 30);
      const em30DiasStr = em30Dias.toISOString().split("T")[0];

      const { data: expiringDocs } = await fetchCollection<any>(
        `users/${user.uid}/documents`,
        [
          where("expiresAt", ">=", hoje),
          where("expiresAt", "<=", em30DiasStr)
        ]
      );

      const filteredExpiringDocs = activeProfile
        ? expiringDocs?.filter(d => d.profileId === activeProfile.id)
        : expiringDocs;

      setStats({
        medicamentosAtivos: activeMedsCount,
        taxaAdesao: adherenceRate,
        proximosEventos: upcomingEventsCount,
        documentosVencendo: filteredExpiringDocs?.length || 0
      });

      // === DADOS DE ADESÃO POR DIA (últimos 30 dias) ===
      // Reuse `filteredRecentDoses` which is already last 30 days

      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        return {
          date: date,
          dateStr: format(date, "yyyy-MM-dd")
        };
      });

      const adherenceByDay: AdherenceData[] = last30Days.map(day => {
        const dayStr = format(day.date, "yyyy-MM-dd");
        const dayDoses = filteredRecentDoses?.filter(d => {
          const doseDate = format(new Date(d.dueAt), "yyyy-MM-dd");
          return doseDate === dayStr;
        }) || [];

        const total = dayDoses.length;
        const taken = dayDoses.filter(d => d.status === "taken").length;
        const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

        return {
          data: format(day.date, "dd/MMM", { locale: ptBR }),
          taxa: rate,
          total: total,
          tomadas: taken
        };
      });

      setAdherenceData(adherenceByDay);

      // Buscar sinais vitais dos últimos 3 meses
      const { data: sinais } = await fetchCollection<any>(
        `users/${user.uid}/vitals`,
        [
          where("date", ">=", threeMonthsAgo.toISOString()),
          orderBy("date", "asc")
        ]
      );

      const filteredSinais = activeProfile
        ? sinais?.filter(s => s.profileId === activeProfile.id)
        : sinais;

      // Processar dados de peso
      const peso = filteredSinais
        ?.filter(s => s.weightKg)
        .map(s => ({
          data: format(new Date(s.date), "dd/MMM", { locale: ptBR }),
          peso: parseFloat(String(s.weightKg))
        })) || [];
      setPesoData(peso);

      // Processar dados de pressão
      const pressao = filteredSinais
        ?.filter(s => s.systolicBP)
        .map(s => ({
          data: format(new Date(s.date), "dd/MMM", { locale: ptBR }),
          sistolica: s.systolicBP,
          diastolica: s.diastolicBP
        })) || [];
      setPressaoData(pressao);

      // Processar dados de glicemia
      const glicemia = filteredSinais
        ?.filter(s => s.glucose)
        .map(s => ({
          data: format(new Date(s.date), "dd/MMM", { locale: ptBR }),
          glicemia: s.glucose
        })) || [];
      setGlicemiaData(glicemia);

      // Buscar exames com valores alterados
      // Note: Assuming 'users/{uid}/exams' has a nested structure or subcollection 'results'
      // Or 'users/{uid}/examResults'
      // Previous Supabase joined exames_laboratoriais and valores_exames.
      // Let's assume `users/{uid}/examResults` exists or we have to query differently.
      // Simplification: We assume `users/{uid}/examResults` which contains individual parameter results, 
      // or we just skip this if the migration of exams is complex. 
      // Given the complexity of nested collections in NoSQL, assume `users/{uid}/examResults`.
      // Filtering by status == 'alterado'.

      const { data: examesResults } = await fetchCollection<any>(
        `users/${user.uid}/examResults`,
        [
          where("status", "==", "alterado"),
          orderBy("date", "desc"),
          limit(10)
        ]
      );

      const filteredExames = activeProfile ? examesResults?.filter(e => e.profileId === activeProfile.id) : examesResults;

      const alterados: ExamValue[] = (filteredExames || []).map(valor => ({
        parametro: valor.parameter,
        valor: valor.value,
        data: valor.date,
        status: valor.status,
        referencia_min: valor.referenceMin,
        referencia_max: valor.referenceMax
      }));
      setExamesAlterados(alterados);

      // === CORRELAÇÃO ADESÃO x SINAIS VITAIS ===
      const filteredVitalsLast30 = filteredSinais?.filter(s =>
        new Date(s.date) >= thirtyDaysAgo
      ) || [];

      // Correlacionar com os dados de adesão já calculados
      const correlations: CorrelationData[] = last30Days.map((day, index) => {
        const dayStr = format(day.date, "yyyy-MM-dd");
        const adesao = adherenceByDay[index]?.taxa || 0;

        // Buscar sinais vitais do dia
        const dayVitals = filteredVitalsLast30.filter(v => {
          const vitalDate = format(new Date(v.date), "yyyy-MM-dd");
          return vitalDate === dayStr;
        });

        // Use the latest vital of the day
        const vital = dayVitals[dayVitals.length - 1];

        return {
          data: format(day.date, "dd/MMM", { locale: ptBR }),
          adesao: adesao,
          peso: vital?.weightKg ? parseFloat(String(vital.weightKg)) : undefined,
          pressao: vital?.systolicBP || undefined,
          glicemia: vital?.glucose || undefined
        };
      });

      setCorrelationData(correlations);

      // === COMPARAÇÃO DE PERÍODOS ===
      const mesAtualInicio = startOfMonth(new Date());
      const mesAtualFim = endOfMonth(new Date());
      const mesAnteriorInicio = startOfMonth(subMonths(new Date(), 1));
      const mesAnteriorFim = endOfMonth(subMonths(new Date(), 1));

      // Fetch doses for larger range to cover both months (optimization)
      const { data: periodDoses } = await fetchCollection<any>(
        `users/${user.uid}/doses`,
        [
          where("dueAt", ">=", mesAnteriorInicio.toISOString()),
          where("dueAt", "<=", mesAtualFim.toISOString())
        ]
      );

      const filteredPeriodDoses = activeProfile
        ? periodDoses?.filter(d => itemProfileMap.get(d.itemId) === activeProfile.id)
        : periodDoses;

      const dosesCurrentMonth = filteredPeriodDoses?.filter(d =>
        new Date(d.dueAt) >= mesAtualInicio && new Date(d.dueAt) <= mesAtualFim
      ) || [];

      const dosesPreviousMonth = filteredPeriodDoses?.filter(d =>
        new Date(d.dueAt) >= mesAnteriorInicio && new Date(d.dueAt) <= mesAnteriorFim
      ) || [];

      const totalCurrentMonth = dosesCurrentMonth.length;
      const takenCurrentMonth = dosesCurrentMonth.filter(d => d.status === "taken").length;
      const adherenceCurrentMonth = totalCurrentMonth > 0 ? Math.round((takenCurrentMonth / totalCurrentMonth) * 100) : 0;

      const totalPreviousMonth = dosesPreviousMonth.length;
      const takenPreviousMonth = dosesPreviousMonth.filter(d => d.status === "taken").length;
      const adherencePreviousMonth = totalPreviousMonth > 0 ? Math.round((takenPreviousMonth / totalPreviousMonth) * 100) : 0;

      // Meds count snapshots (using created_at approximation)
      const activeMedsCurrent = activeMeds?.filter(m => new Date(m.createdAt) <= mesAtualFim).length || 0;
      const activeMedsPrevious = activeMeds?.filter(m => new Date(m.createdAt) <= mesAnteriorFim).length || 0;

      // Calcular tendências e variações
      const adesaoDiff = adherenceCurrentMonth - adherencePreviousMonth;
      const dosesDiff = takenCurrentMonth - takenPreviousMonth;
      const medsDiff = activeMedsCurrent - activeMedsPrevious;

      const getTrend = (diff: number): 'up' | 'down' | 'stable' => {
        if (diff > 2) return 'up';
        if (diff < -2) return 'down';
        return 'stable';
      };

      setPeriodComparison({
        mesAtual: {
          adesao: adherenceCurrentMonth,
          dosesTomadas: takenCurrentMonth,
          dosesTotal: totalCurrentMonth,
          medicamentos: activeMedsCurrent
        },
        mesAnterior: {
          adesao: adherencePreviousMonth,
          dosesTomadas: takenPreviousMonth,
          dosesTotal: totalPreviousMonth,
          medicamentos: activeMedsPrevious
        },
        tendencias: {
          adesao: getTrend(adesaoDiff),
          doses: getTrend(dosesDiff),
          medicamentos: getTrend(medsDiff)
        },
        variacoes: {
          adesao: adesaoDiff,
          doses: dosesDiff,
          medicamentos: medsDiff
        }
      });

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      toast.error(t("toast.health.dashboardError"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 pb-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-24">
        <div className="max-w-6xl mx-auto p-4 space-y-6">

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Dados & Insights
            </h1>
            <p className="text-muted-foreground">
              Análise completa da sua saúde e correlação com adesão aos medicamentos
            </p>
          </div>

          {/* Ferramentas de Saúde */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Ferramentas de Saúde</h2>
            <HealthToolsGrid />
          </div>

          {/* Estatísticas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/medicamentos')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold">{stats.medicamentosAtivos}</p>
                    <p className="text-xs text-muted-foreground truncate">Medicamentos Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/historico')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stats.taxaAdesao >= 80 ? 'bg-green-500/10' : stats.taxaAdesao >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10'
                    }`}>
                    <Target className={`h-5 w-5 ${stats.taxaAdesao >= 80 ? 'text-green-600' : stats.taxaAdesao >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold">{stats.taxaAdesao}%</p>
                    <p className="text-xs text-muted-foreground truncate">Progresso (30d)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/consultas')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold">{stats.proximosEventos}</p>
                    <p className="text-xs text-muted-foreground truncate">Próximos Eventos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/carteira')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stats.documentosVencendo > 0 ? 'bg-orange-500/10' : 'bg-gray-500/10'
                    }`}>
                    <FileText className={`h-5 w-5 ${stats.documentosVencendo > 0 ? 'text-orange-600' : 'text-gray-600'
                      }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold">{stats.documentosVencendo}</p>
                    <p className="text-xs text-muted-foreground truncate">Docs Vencendo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights Automáticos */}
          {stats.taxaAdesao < 50 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      Atenção: Progresso Baixo
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-200 mb-3">
                      Seu progresso está em {stats.taxaAdesao}%. Manter a regularidade é essencial para o tratamento.
                    </p>
                    <Button size="sm" variant="destructive" onClick={() => navigate('/hoje')}>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Ver Doses de Hoje
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.documentosVencendo > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                      {stats.documentosVencendo} Documento{stats.documentosVencendo > 1 ? 's' : ''} Vencendo em Breve
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-200 mb-3">
                      Verifique seus documentos que estão próximos do vencimento.
                    </p>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => navigate('/carteira')}>
                      <FileText className="h-4 w-4 mr-1.5" />
                      Abrir Carteira
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparação de Períodos */}
          {periodComparison && (
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-blue-600" />
                  Evolução Mensal
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Comparação: {format(subMonths(new Date(), 1), "MMMM", { locale: ptBR })} vs {format(new Date(), "MMMM", { locale: ptBR })}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Taxa de Adesão */}
                  <div className="bg-background rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Progresso</span>
                      {periodComparison.tendencias.adesao === 'up' && (
                        <Badge variant="default" className="bg-green-500">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{periodComparison.variacoes.adesao}%
                        </Badge>
                      )}
                      {periodComparison.tendencias.adesao === 'down' && (
                        <Badge variant="destructive">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {periodComparison.variacoes.adesao}%
                        </Badge>
                      )}
                      {periodComparison.tendencias.adesao === 'stable' && (
                        <Badge variant="secondary">
                          Estável
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">
                          {periodComparison.mesAtual.adesao}%
                        </span>
                        <span className="text-sm text-muted-foreground">atual</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mês anterior: {periodComparison.mesAnterior.adesao}%
                      </div>
                    </div>
                  </div>

                  {/* Doses Tomadas */}
                  <div className="bg-background rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Doses Tomadas</span>
                      {periodComparison.tendencias.doses === 'up' && (
                        <Badge variant="default" className="bg-green-500">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{periodComparison.variacoes.doses}
                        </Badge>
                      )}
                      {periodComparison.tendencias.doses === 'down' && (
                        <Badge variant="destructive">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {periodComparison.variacoes.doses}
                        </Badge>
                      )}
                      {periodComparison.tendencias.doses === 'stable' && (
                        <Badge variant="secondary">
                          Estável
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">
                          {periodComparison.mesAtual.dosesTomadas}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {periodComparison.mesAtual.dosesTotal}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mês anterior: {periodComparison.mesAnterior.dosesTomadas} / {periodComparison.mesAnterior.dosesTotal}
                      </div>
                    </div>
                  </div>

                  {/* Medicamentos */}
                  <div className="bg-background rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Medicamentos</span>
                      {periodComparison.tendencias.medicamentos === 'up' && (
                        <Badge variant="secondary">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{periodComparison.variacoes.medicamentos}
                        </Badge>
                      )}
                      {periodComparison.tendencias.medicamentos === 'down' && (
                        <Badge variant="secondary">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {periodComparison.variacoes.medicamentos}
                        </Badge>
                      )}
                      {periodComparison.tendencias.medicamentos === 'stable' && (
                        <Badge variant="secondary">
                          Estável
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">
                          {periodComparison.mesAtual.medicamentos}
                        </span>
                        <span className="text-sm text-muted-foreground">ativos</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mês anterior: {periodComparison.mesAnterior.medicamentos}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mensagem de incentivo */}
                {periodComparison.tendencias.adesao === 'up' && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <span>Parabéns! Sua adesão melhorou {periodComparison.variacoes.adesao}% este mês. Continue assim!</span>
                    </p>
                  </div>
                )}
                {periodComparison.tendencias.adesao === 'down' && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Sua adesão caiu {Math.abs(periodComparison.variacoes.adesao)}% este mês. Vamos melhorar juntos!</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Adesão ao Longo do Tempo */}
          {adherenceData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Adesão aos Medicamentos (Últimos 30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={adherenceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis yAxisId="left" label={{ value: 'Taxa (%)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Doses', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="taxa"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Progresso (%)"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="tomadas"
                      fill="#22c55e"
                      name="Doses Tomadas"
                      opacity={0.6}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="total"
                      fill="#94a3b8"
                      name="Total de Doses"
                      opacity={0.3}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Correlação: Adesão x Sinais Vitais */}
          {correlationData.some(d => d.pressao || d.peso || d.glicemia) && (
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Correlação: Adesão x Saúde
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Veja como sua adesão aos medicamentos impacta seus sinais vitais ao longo do tempo
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {correlationData.some(d => d.pressao !== undefined) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Adesão vs Pressão Arterial
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={correlationData.filter(d => d.pressao !== undefined)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" />
                        <YAxis yAxisId="left" label={{ value: 'Adesão (%)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Pressão', angle: 90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="adesao"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Adesão (%)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="pressao"
                          stroke="#ef4444"
                          strokeWidth={2}
                          name="Pressão Sistólica"
                          dot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {correlationData.some(d => d.glicemia !== undefined) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      Adesão vs Glicemia
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={correlationData.filter(d => d.glicemia !== undefined)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" />
                        <YAxis yAxisId="left" label={{ value: 'Adesão (%)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Glicemia', angle: 90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="adesao"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Adesão (%)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="glicemia"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name="Glicemia (mg/dL)"
                          dot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {correlationData.some(d => d.peso !== undefined) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Adesão vs Peso
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={correlationData.filter(d => d.peso !== undefined)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" />
                        <YAxis yAxisId="left" label={{ value: 'Adesão (%)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Peso (kg)', angle: 90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="adesao"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Adesão (%)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="peso"
                          stroke="#22c55e"
                          strokeWidth={2}
                          name="Peso (kg)"
                          dot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Exames Alterados */}
          {examesAlterados.length > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-5 w-5" />
                  Valores Alterados Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {examesAlterados.slice(0, 5).map((exame, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div>
                        <p className="font-medium">{exame.parametro}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(exame.data), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">{exame.valor}</p>
                        {(exame.referencia_min || exame.referencia_max) && (
                          <p className="text-xs text-muted-foreground">
                            Ref: {exame.referencia_min} - {exame.referencia_max}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sinais Vitais Individuais */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Evolução dos Sinais Vitais</h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/perfil')}>
                <Activity className="h-4 w-4 mr-1.5" />
                Registrar Dados
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* Peso */}
            {pesoData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Evolução do Peso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsLineChart data={pesoData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="peso"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Pressão Arterial */}
            {pressaoData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-500" />
                    Pressão Arterial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsLineChart data={pressaoData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sistolica"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="Sistólica"
                      />
                      <Line
                        type="monotone"
                        dataKey="diastolica"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Diastólica"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Glicemia */}
            {glicemiaData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-blue-500" />
                    Glicemia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsLineChart data={glicemiaData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="glicemia"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Empty State */}
          {pesoData.length === 0 && pressaoData.length === 0 && glicemiaData.length === 0 && adherenceData.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Comece a usar o app para ver insights</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  À medida que você registra suas doses e sinais vitais, esta página mostrará
                  correlações importantes entre sua adesão aos medicamentos e sua saúde.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={() => navigate('/hoje')}>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Registrar Doses
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/perfil')}>
                    <Activity className="h-4 w-4 mr-1.5" />
                    Adicionar Sinais Vitais
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Links Rápidos */}
          <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
            <CardHeader>
              <CardTitle className="text-lg">Explore Mais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/historico')}>
                  <Clock className="h-5 w-5 text-primary" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">Histórico</div>
                    <div className="text-xs text-muted-foreground">Ver todas as doses</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/timeline')}>
                  <LineChart className="h-5 w-5 text-primary" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">Timeline</div>
                    <div className="text-xs text-muted-foreground">Linha do tempo</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/relatorios')}>
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">Relatórios</div>
                    <div className="text-xs text-muted-foreground">Gerar PDF</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
