import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FluidBackgroundProps {
  className?: string;
  variant?: "full" | "hero" | "card" | "subtle";
  animated?: boolean;
  children?: React.ReactNode;
}

export function FluidBackground({
  className,
  variant = "full",
  animated = true,
  children,
}: FluidBackgroundProps) {
  const baseClasses = "relative overflow-hidden";
  
  const variantClasses = {
    full: "min-h-screen",
    hero: "min-h-[50vh]",
    card: "rounded-2xl",
    subtle: "",
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-fluid" />
      
      {/* Animated blob 1 - Top right */}
      <motion.div
        className="absolute -top-1/4 -right-1/4 w-[60%] h-[60%] rounded-full bg-gradient-blob-1 opacity-60 blur-3xl"
        animate={animated ? {
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        } : undefined}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Animated blob 2 - Bottom left */}
      <motion.div
        className="absolute -bottom-1/4 -left-1/4 w-[70%] h-[70%] rounded-full bg-gradient-blob-2 opacity-50 blur-3xl"
        animate={animated ? {
          x: [0, -25, 0],
          y: [0, 25, 0],
          scale: [1, 1.15, 1],
        } : undefined}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Animated blob 3 - Center */}
      <motion.div
        className="absolute top-1/3 left-1/3 w-[50%] h-[50%] rounded-full bg-gradient-blob-3 opacity-40 blur-3xl"
        animate={animated ? {
          x: [0, 20, -20, 0],
          y: [0, -15, 15, 0],
          scale: [1, 1.05, 0.95, 1],
        } : undefined}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Organic wave overlay */}
      <svg
        className="absolute bottom-0 left-0 w-full h-1/3 opacity-20"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <motion.path
          fill="white"
          d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,133.3C672,117,768,139,864,165.3C960,192,1056,224,1152,218.7C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          animate={animated ? {
            d: [
              "M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,133.3C672,117,768,139,864,165.3C960,192,1056,224,1152,218.7C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
              "M0,128L48,149.3C96,171,192,213,288,218.7C384,224,480,192,576,165.3C672,139,768,117,864,133.3C960,149,1056,203,1152,213.3C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
              "M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,133.3C672,117,768,139,864,165.3C960,192,1056,224,1152,218.7C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
            ],
          } : undefined}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Simpler decorative element for cards
export function FluidAccent({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden rounded-2xl", className)}>
      <div className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-blob-accent opacity-30 blur-2xl" />
    </div>
  );
}

// Static gradient overlay for subtle backgrounds
export function FluidOverlay({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 bg-gradient-fluid-subtle pointer-events-none", className)} />
  );
}
