import React from "react";
import { cn } from "@/lib/utils";

/**
 * CardBase Component - The atomic unit for HoraMed's UI.
 * Standardizes glassmorphism, fluid gradients, and interactive states.
 */

interface CardBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "fluid" | "surface" | "flat";
  tier?: 1 | 2 | 3; // Shadow/Elevation/Border intensity
  hover?: boolean;
  padding?: string | boolean;
  children: React.ReactNode;
}

const CardBase = React.forwardRef<HTMLDivElement, CardBaseProps>(
  ({ 
    className, 
    variant = "surface", 
    tier = 1, 
    hover = false, 
    padding = "p-4", 
    children, 
    ...props 
  }, ref) => {
    
    // Tier definitions (Depth and Contrast)
    const tierStyles = {
      1: "shadow-sm border-border/30",
      2: "shadow-md border-border/50",
      3: "shadow-lg border-border/80",
    };

    // Variant definitions (Material)
    const variantStyles = {
      glass: "glass-card backdrop-blur-md",
      fluid: "bg-gradient-fluid text-white border-white/10",
      surface: "bg-card text-card-foreground",
      flat: "bg-secondary/40 border-transparent",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border transition-all duration-300 ease-out",
          tierStyles[tier as keyof typeof tierStyles],
          variantStyles[variant as keyof typeof variantStyles],
          // Performance-optimized hover (transform only)
          hover && "hover:shadow-glow hover:-translate-y-1 cursor-pointer active:scale-[0.98]",
          // Handle boolean padding for convenience
          padding === true ? "p-4" : padding === false ? "p-0" : padding,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardBase.displayName = "CardBase";

export default CardBase;
