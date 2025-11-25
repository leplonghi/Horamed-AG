import { useState } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import HealthCalendar from "@/components/HealthCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, Stethoscope, Activity } from "lucide-react";

export default function Agenda() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 pt-24">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Agenda de Saúde</h1>
              <p className="text-muted-foreground">
                Gerencie todos os seus compromissos de saúde de forma intuitiva
              </p>
            </div>
            <Button onClick={() => navigate('/saude/consultas')} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Compromisso
            </Button>
          </div>

          <HealthCalendar onDateSelect={setSelectedDate} />

          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Sincronização com Google Agenda</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Mantenha todos os seus compromissos de saúde sincronizados automaticamente:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-blue-600" />
                    <span>Consultas médicas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <span>Exames laboratoriais</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-orange-600" />
                    <span>Lembretes de medicamentos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span>Eventos de saúde</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
