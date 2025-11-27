import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function EnergyHintWidget() {
  // Simple rule-based energy prediction
  const hints = [
    "Estabilidade prevista hoje com base na sua rotina",
    "Energia consistente esperada para o dia",
    "Sua rotina indica bom nível energético hoje"
  ];
  
  const hint = hints[Math.floor(Math.random() * hints.length)];
  
  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Previsão de Energia</p>
            <p className="text-sm text-foreground mt-1">{hint}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
