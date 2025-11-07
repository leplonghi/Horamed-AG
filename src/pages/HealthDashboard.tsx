import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  LineChart
} from "lucide-react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ExamValue {
  parametro: string;
  valor: number;
  data: string;
  status: string;
  referencia_min?: number;
  referencia_max?: number;
}

export default function HealthDashboard() {
  const [loading, setLoading] = useState(true);
  const [pesoData, setPesoData] = useState<any[]>([]);
  const [pressaoData, setPressaoData] = useState<any[]>([]);
  const [glicemiaData, setGlicemiaData] = useState<any[]>([]);
  const [examesAlterados, setExamesAlterados] = useState<ExamValue[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const threeMonthsAgo = subMonths(new Date(), 3);

      // Buscar sinais vitais dos últimos 3 meses
      const { data: sinais } = await supabase
        .from("sinais_vitais")
        .select("*")
        .eq("user_id", user.id)
        .gte("data_medicao", threeMonthsAgo.toISOString())
        .order("data_medicao", { ascending: true });

      // Processar dados de peso
      const peso = sinais
        ?.filter(s => s.peso_kg)
        .map(s => ({
          data: format(new Date(s.data_medicao), "dd/MMM", { locale: ptBR }),
          peso: parseFloat(String(s.peso_kg))
        })) || [];
      setPesoData(peso);

      // Processar dados de pressão
      const pressao = sinais
        ?.filter(s => s.pressao_sistolica)
        .map(s => ({
          data: format(new Date(s.data_medicao), "dd/MMM", { locale: ptBR }),
          sistolica: s.pressao_sistolica,
          diastolica: s.pressao_diastolica
        })) || [];
      setPressaoData(pressao);

      // Processar dados de glicemia
      const glicemia = sinais
        ?.filter(s => s.glicemia)
        .map(s => ({
          data: format(new Date(s.data_medicao), "dd/MMM", { locale: ptBR }),
          glicemia: s.glicemia
        })) || [];
      setGlicemiaData(glicemia);

      // Buscar exames com valores alterados
      const { data: exames } = await supabase
        .from("exames_laboratoriais")
        .select(`
          id,
          data_exame,
          valores_exames!inner(*)
        `)
        .eq("user_id", user.id)
        .eq("valores_exames.status", "alterado")
        .gte("data_exame", threeMonthsAgo.toISOString())
        .order("data_exame", { ascending: false })
        .limit(10);

      const alterados: ExamValue[] = [];
      exames?.forEach((exame: any) => {
        exame.valores_exames?.forEach((valor: any) => {
          if (valor.status === 'alterado') {
            alterados.push({
              parametro: valor.parametro,
              valor: valor.valor,
              data: exame.data_exame,
              status: valor.status,
              referencia_min: valor.referencia_min,
              referencia_max: valor.referencia_max
            });
          }
        });
      });
      setExamesAlterados(alterados);

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      toast.error("Erro ao carregar dados");
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
        <Navigation />
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
              <Activity className="h-8 w-8 text-primary" />
              Dados & Insights
            </h1>
            <p className="text-muted-foreground">
              Análise completa da sua saúde e adesão aos medicamentos
            </p>
          </div>

          {/* Info Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Correlação entre Saúde e Adesão</h3>
                  <p className="text-sm text-muted-foreground">
                    Esta página mostra a evolução dos seus sinais vitais. Para ver como sua adesão aos medicamentos 
                    se relaciona com esses dados, acesse também o <strong>Histórico de Doses</strong> e os <strong>Relatórios</strong>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Gráficos */}
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
          {pesoData.length === 0 && pressaoData.length === 0 && glicemiaData.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <LineChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Ainda não há dados suficientes</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comece a registrar seus sinais vitais para ver gráficos de evolução
                </p>
                <Button onClick={() => window.location.href = '/perfil'}>
                  Adicionar Sinais Vitais
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Navigation />
    </>
  );
}
