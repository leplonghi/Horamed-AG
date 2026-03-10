import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { TrendUp as TrendingUp, TrendDown as TrendingDown, Target, CalendarBlank as Calendar, Flame, Trophy } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { PremiumTooltip } from "./shared/ChartTooltip";

interface ProgressDashboardProps {
  currentStreak: number;
  longestStreak: number;
  thisWeekAverage: number;
  lastWeekAverage: number;
  monthlyGoal?: number;
  monthlyProgress?: number;
  weeklyAdherence?: Array<{ day: string; percentage: number }>;
}

export default function ProgressDashboard({
  currentStreak,
  longestStreak,
  thisWeekAverage,
  lastWeekAverage,
  monthlyGoal = 90,
  monthlyProgress = 0,
  weeklyAdherence = [],
}: ProgressDashboardProps) {
  const isImproving = thisWeekAverage > lastWeekAverage;
  const improvementPercent = lastWeekAverage > 0
    ? Math.round(((thisWeekAverage - lastWeekAverage) / lastWeekAverage) * 100)
    : 0;

  const goalReached = monthlyProgress >= monthlyGoal;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        Seu Progresso
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Streak - Vibrant Orange/Red Gradient */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-5 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 border-0 text-white shadow-lg shadow-orange-500/20">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-6 w-6 text-yellow-300 animate-pulse" />
                  <span className="font-semibold">Sequência Atual</span>
                </div>
                <span className="text-4xl font-bold">
                  {currentStreak}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Trophy className="h-4 w-4" />
                <p className="text-sm">
                  Recorde: {longestStreak} dias
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Weekly Comparison - Blue/teal Gradient */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5 bg-gradient-to-br from-blue-500 via-indigo-500 to-teal-600 border-0 text-white shadow-lg shadow-blue-500/20">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isImproving ? (
                    <TrendingUp className="h-5 w-5 text-emerald-300" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-300" />
                  )}
                  <span className="font-semibold">Esta Semana</span>
                </div>
                <span className="text-4xl font-bold">
                  {thisWeekAverage}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {isImproving ? (
                  <>
                    <span className="bg-emerald-400/30 text-emerald-200 px-2 py-0.5 rounded-full font-medium">
                      +{Math.abs(improvementPercent)}%
                    </span>
                    <span className="text-white/70">vs semana passada</span>
                  </>
                ) : (
                  <>
                    <span className="bg-red-400/30 text-red-200 px-2 py-0.5 rounded-full font-medium">
                      {improvementPercent}%
                    </span>
                    <span className="text-white/70">vs semana passada</span>
                  </>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Monthly Goal - Emerald/Teal Gradient */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2"
        >
          <Card className={cn(
            "p-5 border-0 text-white shadow-lg",
            goalReached
              ? "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-emerald-500/20"
              : "bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 shadow-teal-500/20"
          )}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className={cn(
                    "h-5 w-5",
                    goalReached ? "text-yellow-300" : "text-white"
                  )} />
                  <span className="font-semibold">Meta Mensal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/70" />
                  <span className="text-sm text-white/80">
                    {monthlyProgress}% de {monthlyGoal}%
                  </span>
                </div>
              </div>

              <div className="relative">
                <Progress
                  value={Math.min(monthlyProgress, 100)}
                  className="h-4 bg-white/20"
                />
                <div
                  className="absolute inset-0 h-4 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 transition-all duration-500"
                  style={{ width: `${Math.min(monthlyProgress, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                {goalReached ? (
                  <span className="flex items-center gap-2 bg-yellow-400/30 text-yellow-100 px-3 py-1 rounded-full font-medium">
                    Meta atingida!
                  </span>
                ) : (
                  <span className="text-white/80">
                    Faltam {monthlyGoal - monthlyProgress}% para sua meta
                  </span>
                )}
                {!goalReached && (
                  <span className="bg-white/20 px-3 py-1 rounded-full font-medium">
                    Continue assim! 💪
                  </span>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Detail Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-110" />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  Evolução Semanal
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Seu nível de adesão nos últimos 7 dias</p>
              </div>
              <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
                Média: {thisWeekAverage}%
              </div>
            </div>

            <div className="h-[200px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyAdherence.length > 0 ? weeklyAdherence : [
                  { day: 'Seg', percentage: 100 },
                  { day: 'Ter', percentage: 80 },
                  { day: 'Qua', percentage: 95 },
                  { day: 'Qui', percentage: 100 },
                  { day: 'Sex', percentage: 85 },
                  { day: 'Sáb', percentage: 90 },
                  { day: 'Dom', percentage: 100 },
                ]}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fill: 'currentColor', opacity: 0.6 }}
                  />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 8 }}
                    content={<PremiumTooltip title="Seu Desempenho" suffix="%" />}
                  />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]} barSize={24}>
                    {(weeklyAdherence.length > 0 ? weeklyAdherence : [
                      { day: 'Seg', percentage: 100 },
                      { day: 'Ter', percentage: 80 },
                      { day: 'Qua', percentage: 95 },
                      { day: 'Qui', percentage: 100 },
                      { day: 'Sex', percentage: 85 },
                      { day: 'Sáb', percentage: 90 },
                      { day: 'Dom', percentage: 100 },
                    ]).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.percentage >= 80 ? '#10b981' : '#f59e0b'}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
