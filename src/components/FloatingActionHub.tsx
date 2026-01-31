import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Hide when assistant is open
  if (isAssistantOpen) return null;

  return (
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-50">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={onOpenAssistant}
          className={cn(
            "h-16 w-16 rounded-full shadow-xl transition-all duration-300 p-0 overflow-hidden border-2 border-primary/20 bg-background hover:bg-background/90",
            hasUnreadSuggestion && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          size="icon"
        >
          <img
            src="/images/clara.jpg"
            alt="Clara"
            className="w-full h-full object-cover"
          />
        </Button>

        {/* Notification dot */}
        {hasUnreadSuggestion && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center border-2 border-background z-10"
          >
            <Sparkles className="h-3 w-3 text-destructive-foreground" />
          </motion.div>
        )}
      </motion.div>

      {/* Pulse animation for attention if unread */}
      {hasUnreadSuggestion && (
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 pointer-events-none -z-10"
          animate={{ scale: [1, 1.4, 1.4], opacity: [0.5, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}
