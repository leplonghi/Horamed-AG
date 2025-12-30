import { motion } from "framer-motion";
import { Info, Lightbulb, AlertCircle, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type TooltipType = "info" | "tip" | "warning" | "feature";

interface StepTooltipProps {
  type?: TooltipType;
  children: React.ReactNode;
  emoji?: string;
  className?: string;
  compact?: boolean;
}

const typeConfig: Record<TooltipType, {
  gradient: string;
  iconBg: string;
  icon: typeof Info;
}> = {
  info: {
    gradient: "from-blue-400/20 to-indigo-400/20",
    iconBg: "bg-blue-500",
    icon: Info,
  },
  tip: {
    gradient: "from-amber-400/20 to-orange-400/20",
    iconBg: "bg-amber-500",
    icon: Lightbulb,
  },
  warning: {
    gradient: "from-rose-400/20 to-red-400/20",
    iconBg: "bg-rose-500",
    icon: AlertCircle,
  },
  feature: {
    gradient: "from-violet-400/20 to-purple-400/20",
    iconBg: "bg-violet-500",
    icon: Sparkles,
  },
};

export default function StepTooltip({
  type = "info",
  children,
  emoji,
  className,
  compact = false,
}: StepTooltipProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r",
          config.gradient,
          className
        )}
      >
        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white", config.iconBg)}>
          {emoji ? <span className="text-xs">{emoji}</span> : <Icon className="w-3 h-3" />}
        </div>
        <p className="text-xs text-foreground/80">{children}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-xl border-0 shadow-sm",
        className
      )}
    >
      {/* Gradient background */}
      <div className={cn("absolute inset-0 bg-gradient-to-r", config.gradient)} />
      
      <div className="relative flex items-start gap-3 p-4">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
          className={cn(
            "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md",
            config.iconBg
          )}
        >
          {emoji ? (
            <span className="text-lg">{emoji}</span>
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </motion.div>

        {/* Content */}
        <div className="flex-1 pt-1">
          <p className="text-sm text-foreground/90 leading-relaxed">{children}</p>
        </div>
      </div>
    </motion.div>
  );
}
