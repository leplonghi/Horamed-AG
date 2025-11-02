import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { 
  Calendar, 
  TrendingUp, 
  Stethoscope,
  Share2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HealthHistoryLinks() {
  const navigate = useNavigate();

  const links = [
    {
      title: "Linha do Tempo",
      description: "Histórico completo em ordem cronológica",
      icon: Calendar,
      path: "/timeline",
      color: "text-blue-500"
    },
    {
      title: "Dashboard de Evolução",
      description: "Gráficos e análises de saúde",
      icon: TrendingUp,
      path: "/evolucao",
      color: "text-green-500"
    },
    {
      title: "Agenda Médica",
      description: "Consultas e compromissos",
      icon: Stethoscope,
      path: "/agenda",
      color: "text-purple-500"
    }
  ];

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Histórico Médico</h3>
        </div>
        
        <div className="grid gap-2">
          {links.map((link) => (
            <Button
              key={link.path}
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => navigate(link.path)}
            >
              <link.icon className={`h-5 w-5 mr-3 ${link.color}`} />
              <div className="text-left flex-1">
                <div className="font-medium">{link.title}</div>
                <div className="text-xs text-muted-foreground">{link.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
