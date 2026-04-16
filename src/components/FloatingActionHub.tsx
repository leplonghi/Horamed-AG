import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkle as Sparkles } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useDeviceCapability } from "@/hooks/useDeviceCapability";

interface FloatingActionHubProps {
  onOpenAssistant: () => void;
  isAssistantOpen: boolean;
  hasUnreadSuggestion?: boolean;
}

export default function FloatingActionHub({
  onOpenAssistant,
  isAssistantOpen,
  hasUnreadSuggestion = false,
}: FloatingActionHubProps) {
  const { shouldReduceEffects } = useDeviceCapability();

  // Hide when assistant is open
  if (isAssistantOpen) return null;

  return (
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-50">
      <motion.div
        whileHover={shouldReduceEffects ? {} : { scale: 1.1, rotate: 5 }}
        whileTap={shouldReduceEffects ? {} : { scale: 0.9, rotate: -5 }}
        className="relative"
      >
        {/* Magical glow ring - disabled in low performance */}
        {!shouldReduceEffects && (
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse -z-10" />
        )}
        
        <Button
          onClick={onOpenAssistant}
          className={cn(
            "h-16 w-16 rounded-2xl shadow-2xl transition-all duration-500 p-0 overflow-hidden border-2 border-white/20 bg-background hover:border-primary/50",
            hasUnreadSuggestion && "ring-4 ring-primary/20",
            shouldReduceEffects && "shadow-md ring-0"
          )}
          size="icon"
        >
          <img
            src="/images/clara.jpg"
            alt="Clara"
            className={cn(
              "w-full h-full object-cover transform transition-transform duration-700",
              !shouldReduceEffects && "hover:scale-110"
            )}
          />
        </Button>

        {/* Improved Notification badge */}
        <AnimatePresence>
          {hasUnreadSuggestion && (
            <motion.div
              initial={shouldReduceEffects ? { opacity: 0 } : { scale: 0, y: 10 }}
              animate={shouldReduceEffects ? { opacity: 1 } : { scale: 1, y: 0 }}
              exit={shouldReduceEffects ? { opacity: 0 } : { scale: 0, y: 10 }}
              className="absolute -top-2 -right-2 h-7 w-7 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg z-10"
            >
              <Sparkles 
                className={cn("h-4 w-4 text-white", !shouldReduceEffects && "animate-pulse")} 
                weight="fill" 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Ripple Attention Pattern - disabled in low performance */}
      {hasUnreadSuggestion && !shouldReduceEffects && (
        <div className="absolute inset-0 pointer-events-none -z-20">
          {[1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-2xl bg-primary/20"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: i * 0.8,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
