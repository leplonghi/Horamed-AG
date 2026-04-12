import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { 
  TrendUp, 
  TrendDown, 
  Target, 
  Calendar, 
  Flame, 
  Trophy, 
  User, 
  DownloadSimple, 
  CheckCircle, 
  Lightning 
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { PremiumTooltip } from "./shared/ChartTooltip";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
  const isImproving = thisWeekAverage > lastWeekAverage;
  const improvementPercent = lastWeekAverage > 0
    ? Math.round(((thisWeekAverage - lastWeekAverage) / lastWeekAverage) * 100)
    : 0;

  const goalReached = monthlyProgress >= monthlyGoal;

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Level Header - Soft Blue Glass Style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 flex items-center gap-4 border-b border-primary/10"
      >
        <div className="relative">
          <Avatar className="h-16 w-16 rounded-[22px] border-2 border-primary/20 shadow-glow">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User size={32} weight="duotone" />
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-white/20">
            Nível 5
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-lg font-bold text-foreground leading-none">Seu Percurso de Saúde</h3>
              <p className="text-xs text-muted-foreground mt-1">Faltam 450 XP para o Nível 6</p>
            </div>
            <span className="text-xs font-bold text-primary">75%</span>
          </div>
          <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-primary/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              className="h-full bg-gradient-fluid shadow-[0_0_10px_rgba(37,99,235,0.3)]"
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 2. Highlight Streak Card - Big & Bold */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card p-6 bg-gradient-fluid border-0 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Flame size={120} weight="fill" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Flame size={24} weight="fill" className="text-orange-300 animate-pulse" />
                </div>
                <span className="font-semibold text-white/90">Sequência de Fogo</span>
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tighter">{currentStreak}</span>
                <span className="text-xl font-bold opacity-80 uppercase tracking-widest">Dias</span>
              </div>
              
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-white/80">
                  <Trophy size={16} weight="duotone" />
                  <span>Recorde: {longestStreak} d</span>
                </div>
                <div className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Incrivel!
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 3. Stats Summary - Compact Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="glass-card p-4 flex flex-col justify-between border-primary/5">
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-600">
                <CheckCircle size={20} weight="duotone" />
              </div>
              <TrendUp size={16} className="text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{thisWeekAverage}%</div>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pontualidade</div>
            </div>
          </Card>

          <Card className="glass-card p-4 flex flex-col justify-between border-primary/5">
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-600">
                <Lightning size={20} weight="duotone" />
              </div>
              <span className="text-[10px] font-black text-blue-500">+12%</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">128</div>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Doses Tomadas</div>
            </div>
          </Card>

          <Card className="glass-card p-4 col-span-2 flex items-center gap-4 border-primary/5">
            <div className="h-12 w-12 rounded-full border-4 border-primary/10 border-t-primary flex items-center justify-center relative">
              <span className="text-xs font-bold text-primary">82%</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">Meta de Bem-estar</div>
              <div className="text-[10px] text-muted-foreground">Você está próximo de atingir sua meta mensal!</div>
            </div>
            <Target size={24} weight="duotone" className="text-primary/40" />
          </Card>
        </motion.div>
      </div>

      {/* 4. Weekly Analytics Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass-card p-6 border-primary/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Calendar size={20} weight="duotone" className="text-primary" />
                Adesão Semanal
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Visão detalhada dos últimos 7 dias</p>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold ring-1 ring-primary/20">
              Média: {thisWeekAverage}%
            </div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAdherence.length > 0 ? weeklyAdherence : [
                { day: 'Seg', percentage: 95 },
                { day: 'Ter', percentage: 80 },
                { day: 'Qua', percentage: 100 },
                { day: 'Qui', percentage: 90 },
                { day: 'Sex', percentage: 85 },
                { day: 'Sáb', percentage: 95 },
                { day: 'Dom', percentage: 100 },
              ]}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  tick={{ fill: 'currentColor', opacity: 0.5 }}
                  dy={10}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  cursor={{ fill: 'rgba(37, 99, 235, 0.05)', radius: 8 }}
                  content={<PremiumTooltip title="Nível de Adesão" suffix="%" />}
                />
                <Bar dataKey="percentage" radius={[8, 8, 8, 8]} barSize={28}>
                  {(weeklyAdherence.length > 0 ? weeklyAdherence : [
                    { day: 'Seg', percentage: 95 },
                    { day: 'Ter', percentage: 80 },
                    { day: 'Qua', percentage: 100 },
                    { day: 'Qui', percentage: 90 },
                    { day: 'Sex', percentage: 85 },
                    { day: 'Sáb', percentage: 95 },
                    { day: 'Dom', percentage: 100 },
                  ]).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.percentage >= 90 ? 'url(#primaryGradient)' : 'url(#secondaryGradient)'}
                    />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--gradient-mid))" />
                  </linearGradient>
                  <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary) / 0.5)" />
                    <stop offset="100%" stopColor="hsl(var(--primary) / 0.3)" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* 5. Health Report Card - Actionable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-card p-5 bg-secondary/50 border-dashed border-primary/20 flex items-center justify-between group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-fluid opacity-0 group-hover:opacity-[0.03] transition-opacity" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <DownloadSimple size={24} weight="duotone" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Relatório Mensal</h4>
              <p className="text-xs text-muted-foreground">PDF pronto com seu resumo de saúde</p>
            </div>
          </div>
          
          <button className="btn-fluid h-10 px-6 text-sm relative z-10">
            Gerar
          </button>
        </Card>
      </motion.div>
    </div>
  );
}
