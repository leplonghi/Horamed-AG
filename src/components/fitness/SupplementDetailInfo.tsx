import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Lightbulb } from "lucide-react";
import { getSupplementUsageInfo } from "@/utils/supplementHelpers";

interface SupplementDetailInfoProps {
  supplementName: string;
  category: string;
}

export default function SupplementDetailInfo({ supplementName, category }: SupplementDetailInfoProps) {
  const info = getSupplementUsageInfo(supplementName, category);
  
  if (!info) return null;

  return (
    <div className="space-y-3">
      <Card className="border-performance-border bg-performance-bg/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-performance" />
            Informações de uso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Melhor horário</p>
            <p className="text-sm font-semibold text-foreground">{info.bestTime}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Por quê?</p>
            <p className="text-sm text-foreground">{info.rationale}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Dicas adicionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {info.tips.map((tip, idx) => (
              <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-performance">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
