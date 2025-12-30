import { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, Lightbulb, Sparkles, Info, AlertTriangle, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type HintType = "tip" | "info" | "important" | "feature";

interface TutorialHintProps {
  id: string;
  title: string;
  message: string;
  type?: HintType;
  emoji?: string;
  placement?: "top" | "bottom";
}

const typeConfig: Record<HintType, {
  gradient: string;
  iconBg: string;
  icon: typeof Lightbulb;
}> = {
  tip: {
    gradient: "from-amber-400 via-orange-400 to-orange-500",
    iconBg: "bg-amber-500",
    icon: Lightbulb,
  },
  info: {
    gradient: "from-blue-400 via-indigo-400 to-indigo-500",
    iconBg: "bg-blue-500",
    icon: Info,
  },
  important: {
    gradient: "from-rose-400 via-pink-400 to-pink-500",
    iconBg: "bg-rose-500",
    icon: AlertTriangle,
  },
  feature: {
    gradient: "from-violet-400 via-purple-400 to-purple-500",
    iconBg: "bg-violet-500",
    icon: Sparkles,
  },
};

export default function TutorialHint({
  id,
  title,
  message,
  type = "tip",
  emoji,
  placement = "top",
}: TutorialHintProps) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const config = typeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    checkTutorialStatus();
  }, [id]);

  const checkTutorialStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_flags")
        .eq("user_id", user.id)
        .single();

      const flags = (profile?.tutorial_flags as Record<string, boolean>) || {};
      if (!flags[id]) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error("Error checking tutorial status:", error);
    }
  };

  const handleDismiss = async () => {
    setIsVisible(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_flags")
        .eq("user_id", user.id)
        .single();

      const flags = (profile?.tutorial_flags as Record<string, boolean>) || {};
      await supabase
        .from("profiles")
        .update({ tutorial_flags: { ...flags, [id]: true } })
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Error dismissing tutorial:", error);
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80 || Math.abs(info.offset.y) > 50) {
      handleDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: placement === "top" ? -20 : 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: placement === "top" ? -20 : 20, scale: 0.95 }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.3}
        onDragEnd={handleDragEnd}
        whileDrag={{ opacity: 0.8, scale: 0.98 }}
        className={cn(
          "relative overflow-hidden rounded-2xl shadow-xl cursor-grab active:cursor-grabbing",
          placement === "bottom" ? "mt-4" : "mb-4"
        )}
      >
        {/* Gradient background */}
        <div className={cn("absolute inset-0 bg-gradient-to-r", config.gradient)} />
        
        {/* Animated shine effect */}
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        />

        <div className="relative flex items-start gap-3 p-4">
          {/* Icon with pulse */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
            className={cn(
              "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg",
              config.iconBg
            )}
          >
            {emoji ? (
              <span className="text-2xl">{emoji}</span>
            ) : (
              <Icon className="w-6 h-6" />
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-bold text-white text-sm leading-tight mb-1">
              {title}
            </p>
            <p className="text-white/90 text-xs leading-relaxed">
              {message}
            </p>
          </div>

          {/* Close button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </motion.button>
        </div>

        {/* Bottom action bar */}
        <div className="relative flex items-center justify-between px-4 py-2.5 bg-black/10">
          <span className="text-[10px] text-white/70 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Arraste para dispensar
          </span>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDismiss}
            className="px-4 py-1.5 bg-white/25 hover:bg-white/35 rounded-full text-white text-xs font-semibold transition-colors"
          >
            {t('tutorialHint.gotIt')}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
