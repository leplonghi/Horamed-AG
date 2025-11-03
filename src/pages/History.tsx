import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import StreakBadge from "@/components/StreakBadge";
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, TrendingUp, History as HistoryIcon } from "lucide-react";

interface DoseInstance {
  id: string;
  item_id: string;
  due_at: string;
  status: 'scheduled' | 'taken' | 'missed' | 'skipped';
  taken_at: string | null;
  items: {
    name: string;
    dose_text: string | null;
  };
}

export default function History() {
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week');
  const [doses, setDoses] = useState<DoseInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    loadDoses();
    loadStreak();
  }, [activeTab]);

  const loadDoses = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let startDate: Date;
      let endDate: Date;

      if (activeTab === 'week') {
        startDate = startOfWeek(new Date(), { locale: ptBR });
        endDate = endOfWeek(new Date(), { locale: ptBR });
      } else {
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
      }

      const { data, error } = await supabase
        .from('dose_instances')
        .select(`
          id,
          item_id,
          due_at,
          status,
          taken_at,
          items!inner(
            name,
            dose_text,
            user_id
          )
        `)
        .eq('items.user_id', user.id)
        .gte('due_at', startDate.toISOString())
        .lte('due_at', endDate.toISOString())
        .order('due_at', { ascending: false });

      if (error) throw error;
      setDoses((data || []) as DoseInstance[]);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_adherence_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setStreak(data?.current_streak || 0);
    } catch (error) {
      console.error('Erro ao carregar sequência:', error);
    }
  };

  const calculateAdherence = () => {
    if (doses.length === 0) return 0;
    const takenCount = doses.filter(d => d.status === 'taken').length;
    return Math.round((takenCount / doses.length) * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return '✅';
      case 'missed': return '⏭️';
      case 'skipped': return '🚫';
      default: return '⏰';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'taken': return 'Tomado';
      case 'missed': return 'Perdido';
      case 'skipped': return 'Pulado';
      default: return 'Agendado';
    }
  };

  const adherence = calculateAdherence();

  // Group doses by date
  const dosesByDate = doses.reduce((acc, dose) => {
    const dateKey = format(new Date(dose.due_at), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(dose);
    return acc;
  }, {} as Record<string, DoseInstance[]>);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <Navigation />

      <main className="container max-w-4xl mx-auto px-4 pt-20 pb-8">
        {/* Header */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Histórico</h1>
              <p className="text-muted-foreground">
                Acompanhe seu compromisso com a saúde
              </p>
            </div>
            {streak > 0 && <StreakBadge streak={streak} type="current" />}
          </div>

          {/* Adherence Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Adesão {activeTab === 'week' ? 'Semanal' : 'Mensal'}
                  </span>
                  <span className="text-2xl font-bold text-primary">{adherence}%</span>
                </div>
                <Progress value={adherence} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {adherence >= 90 && "🎉 Excelente! Continue assim!"}
                  {adherence >= 70 && adherence < 90 && "💪 Bom trabalho! Continue!"}
                  {adherence >= 50 && adherence < 70 && "⚡ Você pode melhorar!"}
                  {adherence < 50 && "Vamos retomar a rotina!"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Semana
            </TabsTrigger>
            <TabsTrigger value="month" className="gap-2">
              <HistoryIcon className="h-4 w-4" />
              Mês
            </TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="space-y-4">
            {loading ? (
              <Card><CardContent className="py-8 text-center">Carregando...</CardContent></Card>
            ) : Object.keys(dosesByDate).length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">
                Nenhum registro nesta semana
              </CardContent></Card>
            ) : (
              Object.entries(dosesByDate).map(([date, dateDoses]) => (
                <Card key={date}>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">
                      {format(new Date(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <div className="space-y-2">
                      {dateDoses.map(dose => (
                        <div key={dose.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex-1">
                            <p className="font-medium">{dose.items.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(dose.due_at), 'HH:mm')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg">{getStatusIcon(dose.status)}</span>
                            <p className="text-xs text-muted-foreground">{getStatusLabel(dose.status)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            {loading ? (
              <Card><CardContent className="py-8 text-center">Carregando...</CardContent></Card>
            ) : Object.keys(dosesByDate).length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">
                Nenhum registro neste mês
              </CardContent></Card>
            ) : (
              Object.entries(dosesByDate).map(([date, dateDoses]) => (
                <Card key={date}>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">
                      {format(new Date(date), "dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <div className="space-y-2">
                      {dateDoses.map(dose => (
                        <div key={dose.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex-1">
                            <p className="font-medium">{dose.items.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(dose.due_at), 'HH:mm')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg">{getStatusIcon(dose.status)}</span>
                            <p className="text-xs text-muted-foreground">{getStatusLabel(dose.status)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
