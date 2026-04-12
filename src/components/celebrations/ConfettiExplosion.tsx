import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  trigger: boolean;
  onComplete?: () => void;
}

export default function ConfettiExplosion({ trigger, onComplete }: Props) {
  const [particles, setParticles] = useState<Array<{ 
    id: number; 
    x: number; 
    y: number; 
    rotation: number; 
    color: string;
    scale: number;
    delay: number;
  }>>([]);

  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--blue-500))",
    "#FFD700",
    "#FF6B6B",
    "#4ECDC4",
    "#95E1D3",
    "#A78BFA",
  ];

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 80 }, (_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * window.innerWidth * 0.8,
        y: -(Math.random() * 500 + 200),
        rotation: Math.random() * 720,
        color: colors[Math.floor(Math.random() * colors.length)],
        scale: Math.random() * 0.8 + 0.5,
        delay: Math.random() * 0.2,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-sm"
            style={{ 
              backgroundColor: particle.color,
              boxShadow: `0 0 10px ${particle.color}44`
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              rotate: 0,
              scale: 0
            }}
            animate={{
              x: particle.x,
              y: particle.y,
              opacity: [1, 1, 0],
              rotate: particle.rotation,
              scale: particle.scale
            }}
            transition={{
              duration: 2.5,
              delay: particle.delay,
              ease: [0.23, 1, 0.32, 1],
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
