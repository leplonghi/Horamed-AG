import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  itemName: string;
  takenCount: number;
  scheduledCount: number;
  adherence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  unitsLeft: number;
  unitsTotal: number;
}

export function StockConsumptionChart({
  itemName,
  takenCount,
  scheduledCount,
  adherence,
  trend,
  unitsLeft,
  unitsTotal,
}: Props) {
  const { t } = useLanguage();
  const missedCount = scheduledCount - takenCount;
  const stockPercentage = (unitsLeft / unitsTotal) * 100;

  const doseWord = missedCount === 1 ? t('stockTimeline.dose') : t('stockTimeline.doses');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {t('stockChart.analysisTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adherence Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-subtitle">{t('stockChart.yourProgress')}</span>
            <span className={`font-semibold ${
              adherence >= 80 ? 'text-success' :
              adherence >= 60 ? 'text-warning' :
              'text-destructive'
            }`}>
              {adherence}%
            </span>
          </div>
          <Progress value={adherence} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>✓ {takenCount} {t('stockChart.taken')}</span>
            {missedCount > 0 && (
              <span className="text-warning">⚠ {missedCount} {t('stockChart.missed')}</span>
            )}
          </div>
        </div>

        {/* Consumption Trend */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {trend === 'increasing' && (
              <>
                <TrendingUp className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">{t('stockChart.increasing')}</span>
              </>
            )}
            {trend === 'stable' && (
              <>
                <Minus className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('stockChart.stable')}</span>
              </>
            )}
            {trend === 'decreasing' && (
              <>
                <TrendingDown className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">{t('stockChart.decreasing')}</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {trend === 'increasing' && t('stockChart.increasingTip')}
            {trend === 'stable' && t('stockChart.stableTip')}
            {trend === 'decreasing' && t('stockChart.decreasingTip')}
          </p>
        </div>

        {/* Stock Status */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-subtitle">{t('stockChart.remainingStock')}</span>
            <span className={`font-semibold ${
              stockPercentage <= 10 ? 'text-destructive' :
              stockPercentage <= 25 ? 'text-warning' :
              'text-success'
            }`}>
              {unitsLeft} {t('stock.of')} {unitsTotal}
            </span>
          </div>
          <Progress value={stockPercentage} className="h-2" />
        </div>

        {/* Smart Insights */}
        {adherence < 80 && missedCount > 0 && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-xs text-warning-foreground">
              <strong>💡 {t('stockChart.tipLabel')}</strong> {t('stockChart.missedTip', { count: String(missedCount), word: doseWord })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
