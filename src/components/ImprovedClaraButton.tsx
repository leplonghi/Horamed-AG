import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Heart, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, fetchDocument, updateDocument, setDocument } from "@/integrations/firebase";

interface ImprovedClaraButtonProps {
  onClick: () => void;
  isOpen: boolean;
  hasUnreadSuggestion?: boolean;
}

export default function ImprovedClaraButton({
  onClick,
  isOpen,
  hasUnreadSuggestion = false
}: ImprovedClaraButtonProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasSeenClara, setHasSeenClara] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    checkClaraStatus();
  }, [user]);

  const checkClaraStatus = async () => {
    if (!user) return;

    try {
      // Using users/{uid}/profile/me consistent with usage in useHealthAgent
      const { data: profile } = await fetchDocument<any>(`users/${user.uid}/profile`, 'me');

      if (profile?.tutorialFlags) {
        // camelCase: tutorialFlags, claraIntroduced
        if (!profile.tutorialFlags.claraIntroduced) {
          setHasSeenClara(false);
          // Show tooltip after a delay
          setTimeout(() => setShowTooltip(true), 3000);
        }
      } else {
        // If profile or flags don't exist, assume not seen
        setHasSeenClara(false);
        setTimeout(() => setShowTooltip(true), 3000);
      }
    } catch (error) {
      console.error("Error checking Clara status:", error);
    }
  };

  const markClaraSeen = async () => {
    if (!user) return;

    try {
      // Fetch current to merge
      const { data: profile } = await fetchDocument<any>(`users/${user.uid}/profile`, 'me');

      const currentFlags = profile?.tutorialFlags || {};
      const newFlags = { ...currentFlags, claraIntroduced: true };

      if (!profile) {
        // Create if doesn't exist
        await setDocument(`users/${user.uid}/profile`, 'me', {
          tutorialFlags: newFlags,
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateDocument(
          `users/${user.uid}/profile`,
          'me',
          { tutorialFlags: newFlags }
        );
      }

      setHasSeenClara(true);
    } catch (error) {
      console.error("Error marking Clara as seen:", error);
    }
  };

  const handleClick = () => {
    setShowTooltip(false);
    markClaraSeen();
    onClick();
  };

  const handleDismissTooltip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip(false);
    markClaraSeen();
  };

  if (isOpen) return null;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-50">
      <AnimatePresence>
        {/* Tooltip Introduction */}
        {showTooltip && !hasSeenClara && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-64 mb-2"
          >
            <div className="relative bg-card border border-primary/20 rounded-xl p-4 shadow-xl">
              {/* Arrow */}
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card border-b border-r border-primary/20 transform rotate-45" />

              <button
                onClick={handleDismissTooltip}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">
                    {language === 'pt' ? 'Olá! Sou a Clara 💜' : 'Hi! I\'m Clara 💜'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'pt'
                      ? 'Sua assistente de saúde. Toque para conversar comigo!'
                      : 'Your health assistant. Tap to chat with me!'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Button
          onClick={handleClick}
          className={cn(
            "h-14 rounded-full shadow-lg transition-all duration-300",
            isHovered ? "w-auto px-5" : "w-14",
            hasUnreadSuggestion && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          size="icon"
        >
          <motion.div
            animate={{ rotate: hasUnreadSuggestion ? [0, -10, 10, -10, 10, 0] : 0 }}
            transition={{ duration: 0.5, repeat: hasUnreadSuggestion ? Infinity : 0, repeatDelay: 3 }}
            className="flex items-center gap-2"
          >
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/20">
              <img
                src="/images/clara.jpg"
                alt="Clara"
                className="h-full w-full object-cover"
              />
            </div>
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap text-sm font-medium overflow-hidden"
                >
                  Clara
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </Button>

        {/* Notification dot */}
        {hasUnreadSuggestion && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
          >
            <Sparkles className="w-2.5 h-2.5 text-destructive-foreground" />
          </motion.div>
        )}
      </motion.div>

      {/* Pulse animation for first-time users */}
      {!hasSeenClara && (
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}
