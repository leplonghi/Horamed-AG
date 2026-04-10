import { forwardRef, useCallback } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type CardTier = 1 | 2 | 3;

export interface MotionCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  /** Visual tier: 1 = hero/primary, 2 = secondary, 3 = tertiary/subtle */
  tier?: CardTier;
  /** Fires on tap/click with haptic feedback (light on tier 3, medium on tier 1) */
  onTap?: () => void;
  /** Disable hover/tap animations (e.g. inside a list with custom transitions) */
  noMotion?: boolean;
  /** Extra class names */
  className?: string;
}

// ─────────────────────────────────────────────────────────────
// Tier → CSS class mapping (defined in index.css)
// ─────────────────────────────────────────────────────────────

const tierClass: Record<CardTier, string> = {
  1: "card-tier-1",
  2: "card-tier-2",
  3: "card-tier-3",
};

// Framer Motion spring variants per tier
const tierVariants: Record<CardTier, { hover: object; tap: object }> = {
  1: {
    hover: { y: -3, scale: 1.01 },
    tap:   { scale: 0.985 },
  },
  2: {
    hover: { y: -2, scale: 1.005 },
    tap:   { scale: 0.99 },
  },
  3: {
    hover: { y: -1 },
    tap:   { scale: 0.995 },
  },
};

const spring = { type: "spring", stiffness: 380, damping: 28 };

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

/**
 * MotionCard
 *
 * Universal glass-morphism card with Framer Motion micro-animations
 * and integrated haptic feedback. Replaces all ad-hoc `backdrop-blur`
 * + `rounded-*` + `bg-card/…` patterns across the app.
 *
 * Usage:
 *   <MotionCard tier={1}>Hero content</MotionCard>
 *   <MotionCard tier={2} onTap={handleDose}>Dose card</MotionCard>
 *   <MotionCard tier={3} className="p-3">Alert widget</MotionCard>
 */
export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ tier = 2, onTap, noMotion = false, className, children, ...props }, ref) => {
    const { triggerLight, triggerMedium } = useHapticFeedback();

    const handleTap = useCallback(() => {
      if (!onTap) return;
      // Stronger tier = stronger haptic
      if (tier === 1) triggerMedium();
      else triggerLight();
      onTap();
    }, [onTap, tier, triggerLight, triggerMedium]);

    const variants = tierVariants[tier];

    if (noMotion) {
      return (
        <div
          ref={ref}
          className={cn(tierClass[tier], className)}
          onClick={onTap}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        >
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={cn(tierClass[tier], className)}
        whileHover={variants.hover}
        whileTap={variants.tap}
        transition={spring}
        onClick={handleTap}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

MotionCard.displayName = "MotionCard";
