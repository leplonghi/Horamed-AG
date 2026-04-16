import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, Star, Lightning as Zap, Heart, Trophy, Sparkle as Sparkles, Drop } from "@phosphor-icons/react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface MicroCelebrationProps {
  type: "dose_taken" | "streak_day" | "perfect_day" | "milestone" | "level_up" | "combo";
  trigger: boolean;
  onComplete?: () => void;
  streak?: number;
  message?: string;
}

const celebrationConfig = {
  dose_taken: {
    icon: Check,
    color: "text-blue-400",
    bgColor: "bg-blue-400/20",
    duration: 1000,
    scale: [0.8, 1.2, 1],
  },
  streak_day: {
    icon: Flame,
    color: "text-orange-400",
    bgColor: "bg-orange-400/20",
    duration: 1500,
    scale: [0.8, 1.4, 1.1, 1],
  },
  perfect_day: {
    icon: Star,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/20",
    duration: 2500,
    scale: [0.8, 1.6, 1.2, 1],
  },
  milestone: {
    icon: Trophy,
    color: "text-amber-400",
    bgColor: "bg-amber-400/20",
    duration: 3000,
    scale: [0.8, 1.8, 1.3, 1],
  },
  level_up: {
    icon: Zap,
    color: "text-teal-400",
    bgColor: "bg-teal-400/20",
    duration: 2000,
    scale: [0.8, 1.5, 1.2, 1],
  },
  combo: {
    icon: Sparkles,
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/20",
    duration: 1200,
    scale: [0.8, 1.3, 1],
  },
};

const messages = {
  dose_taken: ["Boa!", "Feito!", "Subiu!", "Perfeito!", "💪", "✓", "🌊"],
  streak_day: ["Em chamas!", "No ritmo!", "Continue!", "Incrível!", "🌊🌊"],
  perfect_day: ["Dia Perfeito!", "100%!", "Impecável!", "Mandou bem!", "⚓"],
  milestone: ["Marco atingido!", "Lenda!", "Você evoluiu!", "Conquista!"],
  level_up: ["Subiu de Nível!", "Evolução!", "Poder total!"],
  combo: ["Combo!", "Sequência!", "Em série!", "Wave!"],
};

export default function MicroCelebration({
  type,
  trigger,
  onComplete,
  streak,
  message,
}: MicroCelebrationProps) {
  const [show, setShow] = useState(false);
  const [displayMessage, setDisplayMessage] = useState("");
  const { triggerHaptic } = useHapticFeedback();
  const config = celebrationConfig[type];
  const Icon = config.icon;

  // Generate dynamic particles for the "ocean" feel
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      size: Math.random() * 8 + 4,
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
      delay: Math.random() * 0.5,
    }));
  }, [show]);

  useEffect(() => {
    if (trigger) {
      const typeMessages = messages[type];
      setDisplayMessage(message || typeMessages[Math.floor(Math.random() * typeMessages.length)]);
      setShow(true);

      // Haptic feedback logic
      if (type === "dose_taken" || type === "combo") {
        triggerHaptic("light");
      } else if (type === "streak_day" || type === "perfect_day") {
        triggerHaptic("medium");
      } else {
        triggerHaptic("heavy");
      }

      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, config.duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, type, config.duration, onComplete, message, triggerHaptic]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-[999] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Glassmorphic Background Overlay */}
          <motion.div 
            className="absolute inset-0 bg-blue-500/5 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Central Reward Aura */}
          <motion.div
            className={`absolute w-64 h-64 rounded-full blur-3xl opacity-20 ${config.bgColor}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 2, opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {/* Iconic Centerpiece */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
          >
            <motion.div
              className={`p-8 rounded-[2rem] ${config.bgColor} backdrop-blur-md border border-white/20 shadow-2xl relative group`}
              animate={{
                scale: config.scale,
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 0.8,
                ease: "backOut",
              }}
            >
              <Icon className={`h-16 w-16 ${config.color} drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]`} weight="duotone" />
              
              {/* Ripple Effect */}
              <motion.div 
                className="absolute inset-0 rounded-[2rem] border-2 border-white/30"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1, repeat: 1 }}
              />

              {/* Streak Badge */}
              {streak && streak > 1 && (
                <motion.div
                  className="absolute -top-4 -right-4 bg-gradient-to-br from-orange-400 to-red-500 text-white text-sm font-black rounded-2xl px-3 py-1.5 shadow-lg border-2 border-white"
                  initial={{ scale: 0, x: 20 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  {streak}x
                </motion.div>
              )}
            </motion.div>

            <motion.div className="text-center space-y-1">
              <motion.h3
                className={`text-4xl font-black uppercase tracking-tighter ${config.color} selection-none drop-shadow-md`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
              >
                {displayMessage}
              </motion.h3>
              {type === 'perfect_day' && (
                <motion.p 
                  className="text-white/60 text-sm font-medium tracking-widest uppercase"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Saúde em Dia • {new Date().toLocaleDateString()}
                </motion.p>
              )}
            </motion.div>
          </motion.div>

          {/* Ocean Bubble Particles */}
          <div className="absolute inset-0">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className={`absolute rounded-full border border-white/20 ${config.bgColor}`}
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  x: `calc(50% + ${p.x}px)`,
                  y: `calc(50% + ${p.y}px)`,
                  scale: [0, 1.2, 0],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: p.delay,
                  ease: "easeOut",
                }}
                style={{
                  width: p.size,
                  height: p.size,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
