import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface HelpTooltipProps {
  content: string;
  title?: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  iconSize?: "sm" | "default" | "lg";
  color?: "default" | "primary" | "warning";
}

const colorConfig = {
  default: {
    button: "text-muted-foreground/70 hover:text-primary hover:bg-primary/10",
    tooltip: "bg-gray-900 dark:bg-gray-100",
    text: "text-white dark:text-gray-900",
  },
  primary: {
    button: "text-primary hover:bg-primary/20",
    tooltip: "bg-primary",
    text: "text-primary-foreground",
  },
  warning: {
    button: "text-amber-500 hover:bg-amber-500/20",
    tooltip: "bg-amber-500",
    text: "text-white",
  },
};

export default function HelpTooltip({
  content,
  title,
  side = "top",
  className,
  iconSize = "default",
  color = "default",
}: HelpTooltipProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const colors = colorConfig[color];

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-100 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-100 border-l-transparent border-r-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-100 border-t-transparent border-b-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-100 border-t-transparent border-b-transparent border-l-transparent",
  };

  const animations = {
    top: { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 } },
    bottom: { initial: { opacity: 0, y: -5 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: 5 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: -5 }, animate: { opacity: 1, x: 0 } },
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center justify-center rounded-full p-1 transition-colors",
          colors.button
        )}
        aria-label={t('common.help')}
      >
        <HelpCircle className={iconSizes[iconSize]} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <div
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={animations[side].initial}
              animate={animations[side].animate}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute z-50 min-w-[200px] max-w-[280px] rounded-xl shadow-xl p-3",
                positionClasses[side],
                colors.tooltip
              )}
            >
              {/* Arrow */}
              <div
                className={cn(
                  "absolute border-[6px]",
                  arrowClasses[side]
                )}
              />

              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className={cn("w-3 h-3", colors.text)} />
              </button>

              {/* Content */}
              <div className="pr-5">
                {title && (
                  <p className={cn("font-semibold text-sm mb-1", colors.text)}>
                    {title}
                  </p>
                )}
                <p className={cn("text-xs leading-relaxed opacity-90", colors.text)}>
                  {content}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
