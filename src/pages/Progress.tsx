import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCacheContext } from "@/contexts/ProfileCacheContext";
import StreakAnimation from "@/components/celebrations/StreakAnimation";
import { Trophy, TrendingUp, Calendar, Target } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Progress() {
  const { user } = useAuth();
  const { getProfileCache } = useProfileCacheContext();
  const currentProfile = getProfileCache("current");
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("week");

  // Get streak data
  const { data: streakData } = useQuery({
    queryKey: ["streak", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_adherence_streaks")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get doses statistics
  const { data: doseStats } = useQuery({
    queryKey: ["dose-stats", user?.id, currentProfile?.id, selectedPeriod],
    queryFn: async () => {
      const now = new Date();
      const startDate =
        selectedPeriod === "week"
          ? subDays(now, 7)
          : selectedPeriod === "month"
          ? subDays(now, 30)
          : subDays(now, 365);

      const { data: doses, error } = await supabase
        .from("dose_instances")
        .select("*, items!inner(*)")
        .eq("items.user_id", user?.id)
        .gte("due_at", startDate.toISOString())
        .lte("due_at", now.toISOString());

      if (error) throw error;

      const total = doses?.length || 0;
      const taken = doses?.filter((d) => d.status === "taken").length || 0;
      const skipped = doses?.filter((d) => d.status === "skipped").length || 0;
      const onTime = doses?.filter((d) => d.status === "taken" && (d.delay_minutes || 0) <= 15).length || 0;

      return {
        total,
        taken,
        skipped,
        onTime,
        adherence: total > 0 ? Math.round((taken / total) * 100) : 0,
        onTimeRate: taken > 0 ? Math.round((onTime / taken) * 100) : 0,
      };
    },
    enabled: !!user?.id,
  });

  // Milestones
  const STREAK_MILESTONES = [
    { days: 3, badge: "🌱 Iniciante", reward: "Primeiro passo dado!" },
    { days: 7, badge: "⭐ Consistente", reward: "Uma semana perfeita" },
    { days: 14, badge: "🔥 Em Chamas", reward: "Duas semanas seguidas" },
    { days: 30, badge: "💎 Lendário", reward: "Um mês de dedicação" },
    { days: 100, badge: "🏆 Mestre", reward: "Você é inspirador!" },
  ];

  const currentMilestone = STREAK_MILESTONES.filter(
    (m) => (streakData?.current_streak || 0) >= m.days
  ).pop();

  const nextMilestone = STREAK_MILESTONES.find(
    (m) => (streakData?.current_streak || 0) < m.days
  );

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Header />

      <main className="flex-1 container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Seu Progresso</h1>
            <p className="text-muted-foreground">
              Acompanhe sua jornada de saúde
            </p>
          </div>
        </div>

        {/* Streak Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Compromisso Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <StreakAnimation streak={streakData?.current_streak || 0} />
                  <div>
                    <p className="text-4xl font-bold text-foreground">
                      {streakData?.current_streak || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">dias seguidos</p>
                  </div>
                </div>
                {currentMilestone && (
                  <div className="mt-4 p-3 rounded-lg bg-background/50 border border-border">
                    <p className="font-semibold text-sm">{currentMilestone.badge}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentMilestone.reward}
                    </p>
                  </div>
                )}
              </div>

              {nextMilestone && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Próxima meta</p>
                  <p className="text-lg font-semibold">{nextMilestone.badge}</p>
                  <p className="text-sm text-muted-foreground">
                    Faltam {nextMilestone.days - (streakData?.current_streak || 0)}{" "}
                    dias
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">7 dias</TabsTrigger>
            <TabsTrigger value="month">30 dias</TabsTrigger>
            <TabsTrigger value="all">Todo período</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedPeriod} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Taxa de Adesão</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <p className="text-3xl font-bold">
                      {doseStats?.adherence || 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>No Horário</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <p className="text-3xl font-bold">
                      {doseStats?.onTimeRate || 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Doses Tomadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <p className="text-3xl font-bold">
                      {doseStats?.taken || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total de Doses</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{doseStats?.total || 0}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Navigation />
    </div>
  );
}
