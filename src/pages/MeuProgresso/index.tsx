import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/contexts/LanguageContext";
import { 
  IconHealth as Heartbeat, 
  IconHistory as HistoryIcon,
  IconAchievements as Trophy,
  IconTrend as TrendingUp,
  IconChart as PieChart,
  IconProfile as User
} from "@/components/icons/HoramedIcons";
import { useAnalytics } from "@/hooks/useAnalytics";
import Progress from "@/pages/Progress";
import MedicationHistory from "@/pages/MedicationHistory";
import Achievements from "@/pages/Achievements";
import { cn } from "@/lib/utils";

const MeuProgresso = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("insights");

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 w-full glass-header border-b border-border/40 px-6 py-4 flex flex-col gap-1 ring-1 ring-white/10 dark:ring-black/10 shadow-lg shadow-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {t("nav.meuProgresso")}
            </h1>
            <p className="text-xs font-medium text-muted-foreground/80 tracking-wide uppercase">
              {activeTab === "insights" ? t("nav.insights") : 
               activeTab === "historico" ? t("nav.historico") : 
               t("nav.achievements")}
            </p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="px-2">
            <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/30 backdrop-blur-md rounded-2xl h-14 border border-border/40 shadow-inner">
              <TabsTrigger 
                value="insights" 
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl transition-all duration-300 h-full",
                  "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]"
                )}
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t("nav.insights")}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="historico" 
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl transition-all duration-300 h-full",
                  "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]"
                )}
              >
                <HistoryIcon className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t("nav.historico")}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="conquistas" 
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl transition-all duration-300 h-full",
                  "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]"
                )}
              >
                <Trophy className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t("nav.achievements")}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-full pt-2">
            <AnimatePresence mode="wait">
              <TabsContent value="insights" className="m-0 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Progress />
                </motion.div>
              </TabsContent>

              <TabsContent value="historico" className="m-0 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <MedicationHistory />
                </motion.div>
              </TabsContent>

              <TabsContent value="conquistas" className="m-0 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Achievements />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Decorative background element */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
};

export default MeuProgresso;
