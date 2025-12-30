import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionBubbleProps {
  icon: LucideIcon;
  label: string;
  color?: "primary" | "success" | "warning" | "info";
  onClick: () => void;
  badge?: string | number;
  size?: "sm" | "md" | "lg";
}

const colorConfig = {
  primary: {
    bg: "bg-gradient-to-br from-violet-500 to-purple-600",
    shadow: "shadow-violet-500/30",
  },
  success: {
    bg: "bg-gradient-to-br from-emerald-400 to-green-500",
    shadow: "shadow-emerald-500/30",
  },
  warning: {
    bg: "bg-gradient-to-br from-amber-400 to-orange-500",
    shadow: "shadow-amber-500/30",
  },
  info: {
    bg: "bg-gradient-to-br from-blue-400 to-indigo-500",
    shadow: "shadow-blue-500/30",
  },
};

const sizeConfig = {
  sm: { button: "w-14 h-14", icon: "w-6 h-6", text: "text-[10px]" },
  md: { button: "w-16 h-16", icon: "w-7 h-7", text: "text-xs" },
  lg: { button: "w-20 h-20", icon: "w-8 h-8", text: "text-sm" },
};

export default function ActionBubble({
  icon: Icon,
  label,
  color = "primary",
  onClick,
  badge,
  size = "md",
}: ActionBubbleProps) {
  const colors = colorConfig[color];
  const sizes = sizeConfig[size];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "relative rounded-2xl flex items-center justify-center shadow-lg",
          colors.bg,
          colors.shadow,
          sizes.button
        )}
      >
        <Icon className={cn("text-white", sizes.icon)} />
        
        {/* Badge */}
        {badge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-rose-500 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-[10px] font-bold">{badge}</span>
          </motion.div>
        )}

        {/* Shine effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </motion.button>

      <span className={cn("text-muted-foreground font-medium", sizes.text)}>
        {label}
      </span>
    </div>
  );
}
