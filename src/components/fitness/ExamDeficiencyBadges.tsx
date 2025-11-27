import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface ExamDeficiencyBadgesProps {
  examData: any;
}

export default function ExamDeficiencyBadges({ examData }: ExamDeficiencyBadgesProps) {
  const deficiencies: Array<{ label: string; color: string; detected: boolean }> = [];

  // Check for common vitamin deficiencies in exam metadata
  const checkDeficiency = (keywords: string[]) => {
    const examText = JSON.stringify(examData).toLowerCase();
    return keywords.some(keyword => examText.includes(keyword.toLowerCase()));
  };

  // Vitamina D
  if (checkDeficiency(['vitamina d', 'vitamin d', 'vitd', 'vit d', 'baixa', 'deficiência'])) {
    deficiencies.push({
      label: "Vitamina D baixa",
      color: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
      detected: true
    });
  }

  // B12
  if (checkDeficiency(['vitamina b12', 'vitamin b12', 'b12', 'cobalamina', 'baixa'])) {
    deficiencies.push({
      label: "B12 baixa",
      color: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
      detected: true
    });
  }

  // Ferro
  if (checkDeficiency(['ferro', 'ferritina', 'iron', 'anemia', 'baixo'])) {
    deficiencies.push({
      label: "Ferro baixo",
      color: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
      detected: true
    });
  }

  // Glicemia alterada
  if (checkDeficiency(['glicemia', 'glicose', 'diabetes', 'glucose', 'alta', 'elevada'])) {
    deficiencies.push({
      label: "Alterações glicêmicas",
      color: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
      detected: true
    });
  }

  if (deficiencies.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <p className="text-sm font-semibold text-foreground">Achados Importantes</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {deficiencies.map((def, idx) => (
          <Badge key={idx} variant="outline" className={def.color}>
            {def.label}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Considere discutir com seu médico sobre suplementação adequada.
      </p>
    </div>
  );
}
