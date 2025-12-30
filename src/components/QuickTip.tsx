import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, Lightbulb, Sparkles, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type TipType = "tip" | "info" | "success" | "warning";

interface QuickTipProps {
  type?: TipType;
  title: string;
  message?: string;
  emoji?: string;
  onDismiss?: () => void;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const typeConfig: Record<TipType, { 
  gradient: string; 
  iconBg: string;
  icon: typeof Lightbulb;
  pulse: boolean;
}> = {
  tip: {
    gradient: "from-amber-400 to-orange-500",
    iconBg: "bg-amber-500",
    icon: Lightbulb,
    pulse: true,
  },
  info: {
    gradient: "from-blue-400 to-indigo-500",
    iconBg: "bg-blue-500",
    icon: Info,
    pulse: false,
  },
  success: {
    gradient: "from-emerald-400 to-green-500",
    iconBg: "bg-emerald-500",
    icon: CheckCircle,
    pulse: false,
  },
  warning: {
    gradient: "from-rose-400 to-red-500",
    iconBg: "bg-rose-500",
    icon: AlertTriangle,
    pulse: true,
  },
};

export default function QuickTip({
  type = "tip",
  title,
  message,
  emoji,
  onDismiss,
  dismissible = true,
  action,
  className,
}: QuickTipProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = typeConfig[type];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80 || Math.abs(info.offset.y) > 60) {
      handleDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        drag={dismissible ? true : false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.3}
        onDragEnd={handleDragEnd}
        whileDrag={{ opacity: 0.8, scale: 0.98 }}
        className={cn(
          "relative overflow-hidden rounded-2xl shadow-lg cursor-grab active:cursor-grabbing",
          className
        )}
      >
        {/* Gradient background */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-95",
          config.gradient
        )} />
        
        {/* Animated sparkles overlay */}
        {config.pulse && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-white/10"
          />
        )}

        <div className="relative flex items-center gap-3 p-4">
          {/* Icon with bounce */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md",
              config.iconBg
            )}
          >
            {emoji ? (
              <span className="text-xl">{emoji}</span>
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm leading-tight">
              {title}
            </p>
            {message && (
              <p className="text-white/90 text-xs mt-0.5 leading-snug line-clamp-2">
                {message}
              </p>
            )}
          </div>

          {/* Action or dismiss */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {action && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={action.onClick}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white text-xs font-medium transition-colors"
              >
                {action.label}
              </motion.button>
            )}
            {dismissible && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDismiss}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/80" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Drag indicator */}
        {dismissible && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
            <div className="w-8 h-1 rounded-full bg-white/30" />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
