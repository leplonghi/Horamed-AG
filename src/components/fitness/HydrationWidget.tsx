import { Card, CardContent } from "@/components/ui/card";
import { Droplets } from "lucide-react";

export default function HydrationWidget() {
  // Simple estimation based on user having supplements
  const estimatedHydration = 65; // Percentage
  
  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Droplets className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Hidratação estimada hoje</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${estimatedHydration}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{estimatedHydration}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
