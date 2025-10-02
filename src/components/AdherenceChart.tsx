import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface AdherenceChartProps {
  weeklyData: { day: string; taken: number; total: number }[];
}

export default function AdherenceChart({ weeklyData }: AdherenceChartProps) {
  const maxTotal = Math.max(...weeklyData.map((d) => d.total), 1);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground">Adesão Semanal</h3>
      </div>
      
      <div className="space-y-3">
        {weeklyData.map((day, index) => {
          const adherence = day.total > 0 ? Math.round((day.taken / day.total) * 100) : 0;
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{day.day}</span>
                <span className={`font-medium ${
                  adherence >= 90 ? 'text-primary' : 
                  adherence >= 70 ? 'text-primary/70' : 
                  'text-destructive'
                }`}>
                  {day.taken}/{day.total}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    adherence >= 90 ? 'bg-primary' :
                    adherence >= 70 ? 'bg-primary/70' : 'bg-destructive'
                  }`}
                  style={{ width: `${adherence}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
