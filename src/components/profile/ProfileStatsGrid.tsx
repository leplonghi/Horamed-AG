import { motion } from "framer-motion";
import { 
  Pill, 
  Users, 
  FileText, 
  Crown, 
  CalendarBlank as Calendar, 
  Sparkle as Sparkles, 
  TrendUp as TrendingUp, 
  Trophy,
  ChartLineUp
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useMedications } from "@/hooks/useMedications";
import { useDocumentos } from "@/hooks/useCofre";
import { useStreakCalculator } from "@/hooks/useStreakCalculator";
import { Badge } from "@/components/ui/badge";

interface StatItemProps {
  label: string;
  value: string | number;
  icon: typeof Pill;
  color: "cyan" | "emerald" | "amber" | "indigo" | "rose";
  onClick?: () => void;
  badge?: string;
  isPremium?: boolean;
  delay: number;
}

const StatCard = ({ label, value, icon: Icon, color, onClick, badge, isPremium, delay }: StatItemProps) => {
  const colorMap = {
    cyan: "from-cyan-500/20 to-blue-500/20 text-cyan-400 group-hover:text-cyan-300",
    emerald: "from-emerald-500/20 to-teal-500/20 text-emerald-400 group-hover:text-emerald-300",
    amber: "from-amber-500/20 to-orange-500/20 text-amber-400 group-hover:text-amber-300",
    indigo: "from-indigo-500/20 to-purple-500/20 text-indigo-400 group-hover:text-indigo-300",
    rose: "from-rose-500/20 to-pink-500/20 text-rose-400 group-hover:text-rose-300",
  };

  const glowMap = {
    cyan: "bg-cyan-500/10",
    emerald: "bg-emerald-500/10",
    amber: "bg-amber-500/10",
    indigo: "bg-indigo-500/10",
    rose: "bg-rose-500/10",
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-3 p-5 rounded-3xl",
        "bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden",
        "shadow-lg hover:shadow-2xl transition-all duration-300",
        badge && "ring-1 ring-primary/40"
      )}
    >
      {/* Dynamic Background Glow */}
      <div className={cn(
        "absolute -right-6 -bottom-6 h-20 w-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        glowMap[color]
      )} />

      {badge && (
        <Badge className="absolute top-3 right-3 text-[10px] px-2 py-0.5 bg-primary/20 text-primary border-primary/20 backdrop-blur-md">
          {badge}
        </Badge>
      )}

      <div className={cn(
        "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
        colorMap[color]
      )}>
        <Icon weight="duotone" className="h-6 w-6" />
      </div>

      <div className="flex flex-col items-center text-center">
        <span className="text-2xl font-bold tracking-tight text-white group-hover:scale-105 transition-transform duration-300">
          {value}
        </span>
        <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider mt-1">
          {label}
        </span>
      </div>

      {isPremium && (
        <div className="absolute top-3 left-3">
          <Crown weight="fill" className="h-4 w-4 text-amber-400 animate-pulse" />
        </div>
      )}
    </motion.button>
  );
};

export function ProfileStatsGrid() {
  const { profiles } = useUserProfiles();
  const { isPremium, daysLeft } = useSubscription();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Integrated data hooks (Firebase)
  const { data: medications = [] } = useMedications();
  const { data: documents = [] } = useDocumentos();
  const { currentStreak } = useStreakCalculator();

  const stats = [
    {
      label: t('profile.activeMeds', 'Medicamentos'),
      value: medications.length,
      icon: Pill,
      color: "cyan" as const,
      onClick: () => navigate('/medicamentos'),
      delay: 0.1
    },
    {
      label: t('profile.profiles', 'Perfis'),
      value: profiles.length,
      icon: Users,
      color: "indigo" as const,
      onClick: () => {},
      delay: 0.2
    },
    {
      label: t('nav.achievements', 'Conquistas'),
      value: currentStreak > 0 ? `${currentStreak}d` : "0",
      icon: Trophy,
      color: "emerald" as const,
      onClick: () => navigate('/conquistas'),
      badge: currentStreak > 0 ? t('stats.streakActive', 'Em alta!') : undefined,
      delay: 0.3
    },
    {
      label: isPremium ? t('common.premium', 'Premium') : t('profile.daysLeft', 'Teste'),
      value: isPremium ? '✓' : (daysLeft || 0),
      icon: isPremium ? Crown : Calendar,
      color: isPremium ? "amber" as const : "rose" as const,
      onClick: () => navigate('/planos'),
      isPremium,
      delay: 0.4
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-1">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
