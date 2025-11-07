import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { TrendingUp, Activity, LineChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HealthInsightsCard() {
  const navigate = useNavigate();

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Dados & Insights</h3>
              <p className="text-xs text-muted-foreground">
                Análise da sua evolução
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-auto py-2"
            onClick={() => navigate('/evolucao')}
          >
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Dashboard</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-auto py-2"
            onClick={() => navigate('/timeline')}
          >
            <LineChart className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Linha do Tempo</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Veja como sua adesão aos medicamentos impacta sua saúde ao longo do tempo
        </p>
      </CardContent>
    </Card>
  );
}
