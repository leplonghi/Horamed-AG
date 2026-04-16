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
    size: number;
    type: 'bubble' | 'shimmer';
  }>>([]);

  const colors = [
    "#60A5FA", // blue-400
    "#34D399", // emerald-400
    "#2DD4BF", // teal-400
    "#FBBF24", // amber-400 (gold)
    "#E0F2FE", // sky-100 (water light)
  ];

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 120 }, (_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * window.innerWidth * 1.2,
        y: -(Math.random() * 800 + 400),
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        scale: Math.random() * 1.5 + 0.5,
        delay: Math.random() * 0.4,
        size: Math.random() * 12 + 4,
        type: Math.random() > 0.3 ? 'bubble' : 'shimmer' as const,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1000] overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute left-1/2 bottom-0 ${particle.type === 'bubble' ? 'rounded-full border border-white/30' : 'rotate-45'}`}
            style={{ 
              backgroundColor: particle.type === 'bubble' ? 'transparent' : particle.color,
              boxShadow: particle.type === 'bubble' ? `inset 0 0 10px ${particle.color}44` : `0 0 15px ${particle.color}aa`,
              width: particle.size,
              height: particle.size,
            }}
            initial={{
              x: 0,
              y: 50,
              opacity: 0,
              scale: 0
            }}
            animate={{
              x: particle.x,
              y: particle.y,
              opacity: [0, 1, 1, 0],
              rotate: particle.rotation,
              scale: particle.scale
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: particle.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* Highlight for bubbles */}
            {particle.type === 'bubble' && (
              <div className="absolute top-1 left-1 w-1/4 h-1/4 bg-white/40 rounded-full" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
