import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { TrendingUp, Calendar, Pill, Target } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Charts() {
  const [stats, setStats] = useState({
    weeklyAdherence: 0,
    totalDoses: 0,
    takenDoses: 0,
    streak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const last7Days = subDays(new Date(), 7);

      // Get all doses from last 7 days
      const { data: doses } = await supabase
        .from("dose_instances")
        .select(`
          *,
          items!inner(user_id)
        `)
        .eq("items.user_id", user.id)
        .gte("due_at", last7Days.toISOString());

      if (doses) {
        const total = doses.length;
        const taken = doses.filter((d) => d.status === "taken").length;
        const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;

        setStats({
          weeklyAdherence: adherence,
          totalDoses: total,
          takenDoses: taken,
          streak: 0, // TODO: Calculate streak
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center pb-24">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">MedTracker</h1>
          </div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Gráficos
          </h2>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e adesão
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 bg-primary/5 border-primary/20">
            <div className="flex flex-col gap-2">
              <div className="p-2 rounded-lg bg-primary/10 w-fit">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adesão Semanal</p>
                <p className="text-3xl font-bold text-foreground">{stats.weeklyAdherence}%</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-success/5 border-success/20">
            <div className="flex flex-col gap-2">
              <div className="p-2 rounded-lg bg-success/10 w-fit">
                <Pill className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Doses Tomadas</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.takenDoses}/{stats.totalDoses}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-warning/5 border-warning/20">
            <div className="flex flex-col gap-2">
              <div className="p-2 rounded-lg bg-warning/10 w-fit">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sequência</p>
                <p className="text-3xl font-bold text-foreground">{stats.streak} dias</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-accent/5 border-accent/20">
            <div className="flex flex-col gap-2">
              <div className="p-2 rounded-lg bg-accent/10 w-fit">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tendência</p>
                <p className="text-2xl font-bold text-success">↗ +5%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Weekly Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Últimos 7 dias</h3>
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = subDays(new Date(), 6 - i);
              const dateStr = format(date, "EEE, dd/MM", { locale: ptBR });
              const progress = Math.random() * 100; // TODO: Real data
              
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{dateStr}</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
