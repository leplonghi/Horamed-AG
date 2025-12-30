import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ProgressPillProps {
  current: number;
  total: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export default function ProgressPill({
  current,
  total,
  label,
  size = "md",
  showIcon = true,
}: ProgressPillProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  const getStatus = () => {
    if (percentage === 100) return "complete";
    if (percentage >= 50) return "progress";
    return "pending";
  };

  const status = getStatus();

  const statusConfig = {
    complete: {
      gradient: "from-emerald-400 to-green-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-300",
      icon: CheckCircle,
    },
    progress: {
      gradient: "from-blue-400 to-indigo-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-700 dark:text-blue-300",
      icon: Clock,
    },
    pending: {
      gradient: "from-amber-400 to-orange-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-300",
      icon: AlertCircle,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-5 text-base gap-2.5",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const barHeight = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.bg,
        config.text,
        sizeClasses[size]
      )}
    >
      {showIcon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, delay: 0.1 }}
        >
          <Icon className={iconSizes[size]} />
        </motion.div>
      )}

      <div className="flex items-center gap-2">
        <span className="font-bold">{current}/{total}</span>
        
        {/* Mini progress bar */}
        <div className={cn("w-12 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden", barHeight[size])}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn("h-full rounded-full bg-gradient-to-r", config.gradient)}
          />
        </div>

        {label && <span className="opacity-80">{label}</span>}
      </div>
    </div>
  );
}
