import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Zap, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FitnessProgressWidgetsProps {
  supplementAdherence7Days: number;
  consistencyRate: number;
  hasPreWorkoutSupplements: boolean;
}

export default function FitnessProgressWidgets({ 
  supplementAdherence7Days, 
  consistencyRate,
  hasPreWorkoutSupplements 
}: FitnessProgressWidgetsProps) {
  return (
    <div className="space-y-4">
      {/* Supplement Adherence */}
      <Card className="border-performance-border bg-performance-bg/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-performance" />
            Adesão a suplementos (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-performance">{supplementAdherence7Days}%</span>
              <span className="text-xs text-muted-foreground">últimos 7 dias</span>
            </div>
            <Progress value={supplementAdherence7Days} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Wellness Routine */}
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
            Rotina de bem-estar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{consistencyRate}%</span>
              <span className="text-xs text-muted-foreground">consistência</span>
            </div>
            <p className="text-xs text-muted-foreground">Você está mantendo uma rotina saudável</p>
          </div>
        </CardContent>
      </Card>

      {/* Pre-Workout Consistency (only if applicable) */}
      {hasPreWorkoutSupplements && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Consistência pré-treino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">85%</span>
                <span className="text-xs text-muted-foreground">última semana</span>
              </div>
              <p className="text-xs text-muted-foreground">Preparação consistente para treinos</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
