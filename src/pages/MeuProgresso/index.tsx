import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/contexts/LanguageContext";
import { 
  IconHistory as HistoryIcon,
  IconAchievements as Trophy,
  IconTrendingUp as TrendingUp,
  IconHeartPulse,
} from "@/components/icons/HoramedIcons";
import Progress from "@/pages/Progress";
import MedicationHistory from "@/pages/MedicationHistory";
import Achievements from "@/pages/Achievements";
import HealthDataTab from "@/components/progress/HealthDataTab";
import { cn } from "@/lib/utils";
import OceanBackground from "@/components/ui/OceanBackground";
import Header from "@/components/Header";
import PageHeader from "@/components/PageHeader";

const MeuProgresso = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("insights");

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <OceanBackground variant="page" />
      <Header />
      
      <main className="page-container container mx-auto max-w-2xl px-4 space-y-6 relative z-10 pb-24">
        <PageHeader 
          title={t("nav.meuProgresso")}
          description={
            activeTab === "insights" ? t("progress.description") : 
            activeTab === "historico" ? t("medHistory.subtitle") : 
            t("achievements.description")
          }
        />

        <Tabs defaultValue="insights" className="w-full space-y-8" onValueChange={setActiveTab}>
          <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md py-4 px-1 -mx-1">
            <TabsList className="grid w-full grid-cols-4 p-1 h-auto bg-muted/30 backdrop-blur-md rounded-2xl border border-border/20">
              <TabsTrigger 
                value="insights" 
                className="rounded-xl py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 gap-2 flex-col xs:flex-row"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="text-[10px] xs:text-xs font-semibold">Insights</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="rounded-xl py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 gap-2 flex-col xs:flex-row"
              >
                <HistoryIcon className="h-4 w-4" />
                <span className="text-[10px] xs:text-xs font-semibold">History</span>
              </TabsTrigger>
              <TabsTrigger 
                value="health" 
                className="rounded-xl py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 gap-2 flex-col xs:flex-row"
              >
                <IconHeartPulse className="h-4 w-4" />
                <span className="text-[10px] xs:text-xs font-semibold">Health</span>
              </TabsTrigger>
              <TabsTrigger 
                value="trophies" 
                className="rounded-xl py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 gap-2 flex-col xs:flex-row"
              >
                <Trophy className="h-4 w-4" />
                <span className="text-[10px] xs:text-xs font-semibold">Trophies</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <AnimatePresence mode="wait">
            <TabsContent value="insights" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Progress hideLayout={true} />
              </motion.div>
            </TabsContent>

            <TabsContent value="history" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <MedicationHistory hideLayout={true} />
              </motion.div>
            </TabsContent>

            <TabsContent value="health" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <HealthDataTab hideLayout={true} />
              </motion.div>
            </TabsContent>

            <TabsContent value="trophies" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Achievements hideLayout={true} />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>
    </div>
  );
};

export default MeuProgresso;

