import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  trigger: boolean;
  onComplete?: () => void;
}

export default function ConfettiExplosion({ trigger, onComplete }: Props) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; rotation: number; color: string }>>([]);

  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "#FFD700",
    "#FF6B6B",
    "#4ECDC4",
    "#95E1D3",
  ];

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * -100 - 20,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute top-1/2 left-1/2 w-3 h-3 rounded-sm"
            style={{ backgroundColor: particle.color }}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: particle.x * 5,
              y: particle.y * 3,
              opacity: 0,
              rotate: particle.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              ease: [0.17, 0.67, 0.83, 0.67],
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
