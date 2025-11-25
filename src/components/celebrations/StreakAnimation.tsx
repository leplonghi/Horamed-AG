import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface Props {
  streak: number;
}

export default function StreakAnimation({ streak }: Props) {
  const getFlameColor = () => {
    if (streak >= 30) return "from-orange-500 to-red-500";
    if (streak >= 14) return "from-orange-400 to-orange-600";
    if (streak >= 7) return "from-yellow-400 to-orange-500";
    return "from-yellow-300 to-orange-400";
  };

  const getFlameSize = () => {
    if (streak >= 30) return "h-12 w-12";
    if (streak >= 14) return "h-10 w-10";
    if (streak >= 7) return "h-8 w-8";
    return "h-6 w-6";
  };

  return (
    <motion.div
      className="relative inline-block"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
    >
      {/* Glow effect */}
      <motion.div
        className={`absolute inset-0 blur-xl opacity-50 bg-gradient-to-r ${getFlameColor()} rounded-full`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Flame icon */}
      <motion.div
        animate={{
          y: [0, -5, 0],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Flame className={`${getFlameSize()} fill-current text-orange-500 relative z-10`} />
      </motion.div>

      {/* Streak number */}
      <motion.div
        className="absolute -bottom-1 -right-1 bg-background border-2 border-primary rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold z-20"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
      >
        {streak}
      </motion.div>
    </motion.div>
  );
}
