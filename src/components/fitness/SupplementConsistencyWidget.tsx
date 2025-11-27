import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface SupplementConsistencyWidgetProps {
  last7Days: number[];
}

export default function SupplementConsistencyWidget({ last7Days }: SupplementConsistencyWidgetProps) {
  const average = last7Days.length > 0 
    ? Math.round(last7Days.reduce((a, b) => a + b, 0) / last7Days.length)
    : 0;
  
  return (
    <Card className="border-performance-border bg-performance-bg">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-performance rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Consistência (últimos 7 dias)</p>
            <div className="flex items-center gap-2 mt-2">
              {last7Days.slice(-7).map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-8 bg-muted rounded-sm overflow-hidden flex items-end">
                    <div 
                      className="w-full bg-performance transition-all"
                      style={{ height: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Média: {average}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
