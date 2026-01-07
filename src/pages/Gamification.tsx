import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { GamificationHub } from "@/components/gamification/GamificationHub";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Gamification() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background page-container">
      <PageHeader
        title={t('gamification.title') || "Sua Jornada"}
        description={t('gamification.description') || "Acompanhe seu progresso e conquistas"}
      />

      <motion.div 
        className="container mx-auto p-4 pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <GamificationHub />
      </motion.div>
    </div>
  );
}
