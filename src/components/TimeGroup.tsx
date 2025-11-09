import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import DoseCard from "./DoseCard";

interface TimeGroupProps {
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  doses: Array<{
    id: string;
    item_id: string;
    due_at: string;
    status: 'scheduled' | 'taken' | 'missed' | 'skipped';
    taken_at: string | null;
    items: {
      name: string;
      dose_text: string | null;
    };
    stock?: {
      units_left: number;
    }[];
  }>;
  onTake: (dose: any) => void;
  onMore: (dose: any) => void;
  defaultExpanded?: boolean;
}

export default function TimeGroup({ 
  period, 
  doses, 
  onTake, 
  onMore,
  defaultExpanded = true 
}: TimeGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const periodConfig = {
    morning: {
      icon: Sunrise,
      label: "Manhã",
      subLabel: "6h - 12h",
      color: "from-orange-500/20 to-yellow-500/20",
      iconColor: "text-orange-500",
    },
    afternoon: {
      icon: Sun,
      label: "Tarde",
      subLabel: "12h - 18h",
      color: "from-yellow-500/20 to-amber-500/20",
      iconColor: "text-yellow-600",
    },
    evening: {
      icon: Sunset,
      label: "Noite",
      subLabel: "18h - 22h",
      color: "from-purple-500/20 to-indigo-500/20",
      iconColor: "text-purple-500",
    },
    night: {
      icon: Moon,
      label: "Madrugada",
      subLabel: "22h - 6h",
      color: "from-indigo-500/20 to-blue-900/20",
      iconColor: "text-indigo-400",
    },
  };

  const config = periodConfig[period];
  const PeriodIcon = config.icon;

  const takenCount = doses.filter(d => d.status === 'taken').length;
  const progress = doses.length > 0 ? (takenCount / doses.length) * 100 : 0;

  if (doses.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className={cn(
          "cursor-pointer hover:bg-accent/50 transition-colors bg-gradient-to-r",
          config.color
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full bg-background/80", config.iconColor)}>
              <PeriodIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {config.label}
                <span className="text-sm font-normal text-muted-foreground">
                  {config.subLabel}
                </span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {takenCount} de {doses.length} doses {takenCount === doses.length ? "✓" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{Math.round(progress)}%</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
        <Progress value={progress} className="h-2 mt-3" />
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4 space-y-3">
          {doses.map((dose) => (
            <DoseCard
              key={dose.id}
              dose={dose}
              onTake={() => onTake(dose)}
              onMore={() => onMore(dose)}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}
