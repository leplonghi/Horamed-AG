import { motion } from "framer-motion";
import { Sparkles, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  onComplete: () => void;
  onShowDemo: () => void;
}

export default function OnboardingStep4({ onComplete, onShowDemo }: Props) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleAddItem = () => {
    onComplete(); // Save preferences
    navigate("/adicionar-medicamento");
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <div className="p-6 rounded-full bg-primary/10">
            <Sparkles className="h-16 w-16 text-primary" />
          </div>
        </motion.div>

        <motion.h1
          className="text-3xl md:text-4xl font-bold text-foreground"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {t('onboardingStep4.title')}
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-lg max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {t('onboardingStep4.subtitle')}
        </motion.p>
      </div>

      <motion.div
        className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-shadow">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-full bg-primary/20">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{t('onboardingStep4.addNow')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('onboardingStep4.addNowDesc')}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('onboardingStep4.addFirstItem')}
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-muted/30 to-muted/50 border-border hover:shadow-lg transition-shadow">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-full bg-muted">
                <Eye className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{t('onboardingStep4.seeHow')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('onboardingStep4.seeHowDesc')}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={onShowDemo}
            >
              <Eye className="h-4 w-4 mr-2" />
              {t('onboardingStep4.seeDemo')}
            </Button>
          </div>
        </Card>
      </motion.div>

      <motion.div
        className="text-center mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button variant="ghost" onClick={onComplete}>
          {t('onboardingStep4.explore')}
        </Button>
      </motion.div>
    </div>
  );
}
