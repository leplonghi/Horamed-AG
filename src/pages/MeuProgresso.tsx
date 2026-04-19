import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heartbeat, TrendUp, Trophy } from "@phosphor-icons/react";
import History from "./History";
import Achievements from "./Achievements";
import Gamification from "./Gamification";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MeuProgresso() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "history");

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 pt-20 pb-8 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{t('nav.progress') || "Meu Progresso"}</h1>
          <p className="text-muted-foreground">
            Acompanhe seu histórico de saúde, conquistas e jornada em um só lugar.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-12">
            <TabsTrigger value="history" className="gap-2">
              <Heartbeat className="w-4 h-4" />
              <span className="hidden sm:inline">Medicamentos</span>
              <span className="sm:hidden">Med.</span>
            </TabsTrigger>
            <TabsTrigger value="jornada" className="gap-2">
              <TrendUp className="w-4 h-4" />
              <span className="hidden sm:inline">Sua Jornada</span>
              <span className="sm:hidden">Jornada</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Conquista</span>
              <span className="sm:hidden">Conq.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-0">
            <History hideLayout={true} />
          </TabsContent>

          <TabsContent value="jornada" className="mt-0">
            <Gamification hideLayout={true} />
          </TabsContent>

          <TabsContent value="achievements" className="mt-0">
            <Achievements hideLayout={true} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
