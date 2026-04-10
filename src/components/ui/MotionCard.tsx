import { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

type Tier = 1 | 2 | 3;

interface MotionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Glass hierarchy tier:
   *  1 = Hero/Primary – strongest blur + glow (1 per screen)
   *  2 = Secondary – standard glass  (default)
   *  3 = Supporting – lightweight, no blur
   */
  tier?: Tier;
  /** Fire haptic feedback on press/tap */
  haptic?: boolean;
  /** Haptic intensity (defaults to "light") */
  hapticStyle?: "light" | "medium" | "heavy";
  /** Disables hover lift and haptic */
  static?: boolean;
}

/**
 * MotionCard
 *
 * A glass-morphism card with visual hierarchy tiers.
 * Replaces scattered inline glass styles across the app.
 *
 * Usage:
 *   <MotionCard tier={1} haptic>Hero content</MotionCard>
 *   <MotionCard tier={2}>Secondary info</MotionCard>
 *   <MotionCard tier={3} static>Simple list item</MotionCard>
 */
export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  (
    {
      tier = 2,
      haptic = false,
      hapticStyle = "light",
      static: isStatic = false,
      className,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const { triggerHaptic } = useHapticFeedback();
    const pressedRef = useRef(false);

    const handlePointerDown = () => {
      if (isStatic || !haptic) return;
      pressedRef.current = true;
    };

    const handlePointerUp = async () => {
      if (isStatic || !haptic || !pressedRef.current) return;
      pressedRef.current = false;
      await triggerHaptic(hapticStyle);
    };

    const tierClass: Record<Tier, string> = {
      1: "card-tier-1",
      2: "card-tier-2",
      3: "card-tier-3",
    };

    return (
      <div
        ref={ref}
        className={cn(
          tierClass[tier],
          isStatic && "hover:transform-none hover:shadow-none",
          className
        )}
        onClick={onClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { pressedRef.current = false; }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MotionCard.displayName = "MotionCard";
