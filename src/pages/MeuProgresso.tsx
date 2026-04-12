import { useState } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heartbeat, Calendar, Trophy } from "@phosphor-icons/react";
import MedicalAppointments from "./MedicalAppointments";
import History from "./History";
import Achievements from "./Achievements";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MeuProgresso() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("history");

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 pt-20 pb-8 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{t('nav.progress') || "Meu Progresso"}</h1>
          <p className="text-muted-foreground">
            Acompanhe seu histórico de saúde, consultas e conquistas em um só lugar.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-12">
            <TabsTrigger value="history" className="gap-2">
              <Heartbeat className="w-4 h-4" />
              <span className="hidden sm:inline">Medicamentos</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Consultas</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Conquista</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-0">
            <History hideLayout={true} />
          </TabsContent>

          <TabsContent value="appointments" className="mt-0">
            <MedicalAppointments hideLayout={true} />
          </TabsContent>

          <TabsContent value="achievements" className="mt-0">
            <Achievements hideLayout={true} />
          </TabsContent>
        </Tabs>
      </main>

      <Navigation />
    </div>
  );
}
