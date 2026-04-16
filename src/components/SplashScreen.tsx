import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import horamedLogo from '@/assets/logo_HoraMed.png';

interface SplashScreenProps {
  onComplete: () => void;
  minimumDisplayTime?: number;
}

// Wave path that morphs from the screen edge upward
const WAVE_PATH_START = "M0,100 C150,100 350,100 500,100 L500,0 L0,0 Z";
const WAVE_PATH_END = "M0,100 C80,60 220,140 500,80 L500,0 L0,0 Z";

const SplashScreen = ({ onComplete, minimumDisplayTime = 1000 }: SplashScreenProps) => {
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    const show = setTimeout(() => setPhase("exit"), minimumDisplayTime);
    return () => clearTimeout(show);
  }, [minimumDisplayTime]);

  useEffect(() => {
    if (phase === "exit") {
      const done = setTimeout(onComplete, 650);
      return () => clearTimeout(done);
    }
  }, [phase, onComplete]);

  return (
    <AnimatePresence>
      {phase === "enter" && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.45 } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "hsl(var(--background))" }}
        >
          {/* Animated teal wave at bottom — morphing SVG */}
          <motion.svg
            viewBox="0 0 500 100"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 right-0 w-full h-40 opacity-20"
            aria-hidden="true"
          >
            <motion.path
              fill="hsl(var(--primary))"
              initial={{ d: WAVE_PATH_START }}
              animate={{ d: WAVE_PATH_END }}
              transition={{ duration: 1.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            />
          </motion.svg>

          {/* Second wave layer — offset phase */}
          <motion.svg
            viewBox="0 0 500 100"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 right-0 w-full h-28 opacity-10"
            aria-hidden="true"
          >
            <motion.path
              fill="hsl(var(--primary))"
              initial={{ d: WAVE_PATH_END }}
              animate={{ d: WAVE_PATH_START }}
              transition={{ duration: 1.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            />
          </motion.svg>

          {/* Radial glow — subtle, not mesh gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 50%, hsl(var(--primary)/0.08) 0%, transparent 70%)",
            }}
          />

          {/* Logo — spring scale in */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
            className="relative z-10"
          >
            <img
              src={horamedLogo}
              alt="HoraMed"
              width={192}
              height={180}
              className="w-44 h-auto drop-shadow-xl"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
          </motion.div>

          {/* Tagline — fade + slide up */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.4, ease: "easeOut" }}
            className="relative z-10 mt-5 text-muted-foreground text-sm font-medium tracking-wide"
          >
            Sua saúde no horário certo
          </motion.p>

          {/* Animated progress bar — subtle, not spinner */}
          <motion.div
            className="relative z-10 mt-10 h-0.5 w-24 rounded-full bg-border overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: minimumDisplayTime / 1000 - 0.1, ease: "linear" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
