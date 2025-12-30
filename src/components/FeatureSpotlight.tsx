import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface SpotlightStep {
  id: string;
  emoji: string;
  title: string;
  description: string;
  color: string;
}

interface FeatureSpotlightProps {
  id: string;
  steps: SpotlightStep[];
  onComplete?: () => void;
}

export default function FeatureSpotlight({ id, steps, onComplete }: FeatureSpotlightProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    checkSpotlightStatus();
  }, [id]);

  const checkSpotlightStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_flags")
        .eq("user_id", user.id)
        .single();

      const flags = (profile?.tutorial_flags as Record<string, boolean>) || {};
      if (!flags[`spotlight_${id}`]) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error("Error checking spotlight status:", error);
    }
  };

  const handleComplete = async () => {
    setIsVisible(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_flags")
        .eq("user_id", user.id)
        .single();

      const flags = (profile?.tutorial_flags as Record<string, boolean>) || {};
      await supabase
        .from("profiles")
        .update({ tutorial_flags: { ...flags, [`spotlight_${id}`]: true } })
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Error completing spotlight:", error);
    }
    onComplete?.();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-24"
      >
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleComplete}
        />

        {/* Spotlight Card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative w-full max-w-sm"
        >
          <div 
            className={cn(
              "relative rounded-3xl p-6 shadow-2xl overflow-hidden",
              step.color
            )}
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -right-20 -top-20 w-40 h-40 rounded-full border-4 border-white/30"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full border-4 border-white/20"
              />
            </div>

            {/* Close button */}
            <button
              onClick={handleComplete}
              className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Content */}
            <div className="relative text-center">
              {/* Emoji with bounce */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="text-5xl mb-4"
              >
                {step.emoji}
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-xl font-bold text-white mb-2"
              >
                {step.title}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/90 text-sm leading-relaxed mb-6"
              >
                {step.description}
              </motion.p>

              {/* Progress dots */}
              {steps.length > 1 && (
                <div className="flex justify-center gap-2 mb-4">
                  {steps.map((_, idx) => (
                    <motion.div
                      key={idx}
                      animate={{ 
                        scale: idx === currentStep ? 1.2 : 1,
                        opacity: idx === currentStep ? 1 : 0.5 
                      }}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        idx === currentStep ? "bg-white" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Action button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                className="w-full py-3 px-6 bg-white rounded-xl font-semibold text-gray-900 flex items-center justify-center gap-2 shadow-lg"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Entendi!
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
