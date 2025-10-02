import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

export default function CalendarIntegration() {
  const navigate = useNavigate();

  const handleGoogleCalendar = () => {
    toast.info("Integração com Google Calendar em breve!");
  };

  const handleAppleCalendar = () => {
    toast.info("Integração com Apple Calendar em breve!");
  };

  const handleOutlook = () => {
    toast.info("Integração com Outlook em breve!");
  };

  return (
    <>
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Integração de Calendário
              </h2>
              <p className="text-muted-foreground">Sincronize seus lembretes com seu calendário</p>
            </div>
          </div>

          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Sobre a Integração</h3>
              <p className="text-sm text-muted-foreground">
                Conecte o HoraMed ao seu calendário favorito para visualizar seus horários de medicação
                junto com seus outros compromissos. Os lembretes serão automaticamente sincronizados.
              </p>
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Calendários Disponíveis</h3>
            
            <Card className="p-4 hover:bg-accent/50 transition-colors">
              <button
                onClick={handleGoogleCalendar}
                className="w-full text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    📅
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Google Calendar</p>
                    <p className="text-sm text-muted-foreground">Sincronize com sua conta Google</p>
                  </div>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </button>
            </Card>

            <Card className="p-4 hover:bg-accent/50 transition-colors">
              <button
                onClick={handleAppleCalendar}
                className="w-full text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    🍎
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Apple Calendar</p>
                    <p className="text-sm text-muted-foreground">iCloud Calendar</p>
                  </div>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </button>
            </Card>

            <Card className="p-4 hover:bg-accent/50 transition-colors">
              <button
                onClick={handleOutlook}
                className="w-full text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    📧
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Outlook</p>
                    <p className="text-sm text-muted-foreground">Microsoft Outlook Calendar</p>
                  </div>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </button>
            </Card>
          </div>

          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-muted-foreground">
              💡 <span className="font-semibold">Dica:</span> Após conectar, seus lembretes aparecerão automaticamente
              no calendário escolhido. Você pode desconectar a qualquer momento.
            </p>
          </Card>
        </div>
      </div>
      <Navigation />
    </>
  );
}
