import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { TrendingUp, Activity, LineChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function HealthInsightsCard() {
  const navigate = useNavigate();
  return <Card className="h-full bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardContent className="h-full p-6 space-y-4 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Dados & Insights</h3>
            <p className="text-sm text-muted-foreground">
              Análise da sua evolução
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="default" onClick={() => navigate('/evolucao')} className="w-full py-3">
            <Activity className="h-4 w-4 mr-2" />
            <span className="text-sm">Dashboard</span>
          </Button>
          <Button variant="outline" size="default" onClick={() => navigate('/timeline')} className="w-full py-3">
            <LineChart className="h-4 w-4 mr-2" />
            <span className="text-sm">Linha do Tempo</span>
          </Button>
        </div>
      </CardContent>
    </Card>;
}