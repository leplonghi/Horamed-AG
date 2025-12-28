import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  onComplete: () => void;
}

export default function OnboardingDemo({ onComplete }: Props) {
  const [countdown, setCountdown] = useState(5);
  const [showOverlay, setShowOverlay] = useState(true);
  const { t, language } = useLanguage();

  const demoItems = [
    { name: "Aspirina 100mg", time: "08:00", taken: true },
    { name: language === 'pt' ? "Vitamina D" : "Vitamin D", time: "12:00", taken: false },
    { name: language === 'pt' ? "Ômega 3" : "Omega 3", time: "20:00", taken: false },
  ];

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => {
        setShowOverlay(false);
        setTimeout(onComplete, 500);
      }, 1000);
    }
  }, [countdown, onComplete]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className="relative min-h-[600px]">
      {/* Demo Content */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('onboardingDemo.today')}</h2>
          <p className="text-muted-foreground">
            {formatDate(new Date())}
          </p>
        </div>

        <div className="space-y-3">
          {demoItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        item.taken
                          ? "bg-primary/20"
                          : "bg-muted"
                      }`}
                    >
                      {item.taken ? (
                        <Check className="h-5 w-5 text-primary" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.time}
                      </p>
                    </div>
                  </div>
                  {!item.taken && (
                    <Button size="sm" variant="outline">
                      {t('onboardingDemo.mark')}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">{t('onboardingDemo.streak', { days: '5' })}</p>
              <p className="text-sm text-muted-foreground">
                {t('onboardingDemo.keepGoing')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Overlay explicativo */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center space-y-6 p-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-foreground">
                  {t('onboardingDemo.experienceTitle')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-md">
                  {t('onboardingDemo.experienceDesc')}
                </p>
              </div>

              <div className="inline-flex items-center justify-center">
                <motion.div
                  className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <span className="text-4xl font-bold text-primary">
                    {countdown}
                  </span>
                </motion.div>
              </div>

              <p className="text-sm text-muted-foreground">
                {t('onboardingDemo.startingIn', { 
                  count: String(countdown), 
                  plural: countdown !== 1 ? 's' : '' 
                })}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
