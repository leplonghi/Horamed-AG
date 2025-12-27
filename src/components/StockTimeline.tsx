import { format, subDays, startOfDay } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus, Calendar } from "lucide-react";
import { ConsumptionEntry } from "@/hooks/useStockProjection";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  itemName: string;
  consumptionHistory: ConsumptionEntry[];
  dailyAvg: number;
  daysRemaining: number | null;
}

export function StockTimeline({ itemName, consumptionHistory, dailyAvg, daysRemaining }: Props) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  // Get last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return startOfDay(date);
  });

  // Group consumption by day
  const consumptionByDay = last7Days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const entries = consumptionHistory.filter(e => 
      e.date.startsWith(dateStr)
    );
    const total = entries.reduce((sum, e) => sum + e.amount, 0);
    return { date, total, entries };
  });

  const maxConsumption = Math.max(...consumptionByDay.map(d => d.total), dailyAvg);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {t('stockTimeline.last7Days')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline */}
        <div className="space-y-2">
          {consumptionByDay.map(({ date, total, entries }, idx) => {
            const percentage = maxConsumption > 0 ? (total / maxConsumption) * 100 : 0;
            const isToday = idx === consumptionByDay.length - 1;
            
            return (
              <div key={date.toISOString()} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={`text-subtitle ${isToday ? 'font-semibold text-foreground' : ''}`}>
                    {format(date, 'EEE', { locale: dateLocale })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {total > 0 
                      ? `${total} ${total === 1 ? t('stockTimeline.dose') : t('stockTimeline.doses')}` 
                      : t('stockTimeline.noDose')}
                  </span>
                </div>
                <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full transition-all rounded-full ${
                      total === 0 
                        ? 'bg-transparent'
                        : total > dailyAvg 
                          ? 'bg-warning' 
                          : 'bg-primary'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                  {entries.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-medium text-primary-foreground">
                        {entries.map(e => {
                          if (e.reason === 'taken') return '✓';
                          if (e.reason === 'adjusted') return '⚙';
                          if (e.reason === 'refill') return '📦';
                          if (e.reason === 'lost') return '⚠';
                          return '';
                        }).join(' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="space-y-1">
            <p className="text-tiny text-muted-foreground">{t('stockTimeline.dailyAvg')}</p>
            <p className="text-lg font-semibold">
              {dailyAvg.toFixed(1)} {t('stockTimeline.doses')}
            </p>
          </div>
          {daysRemaining !== null && (
            <div className="space-y-1">
              <p className="text-tiny text-muted-foreground">{t('stockTimeline.estimatedDuration')}</p>
              <p className={`text-lg font-semibold ${
                daysRemaining <= 7 ? 'text-destructive' :
                daysRemaining <= 14 ? 'text-warning' :
                'text-success'
              }`}>
                ~{daysRemaining} {t('stockTimeline.days')}
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <span>✓</span>
            <span>{t('stockTimeline.taken')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⚙</span>
            <span>{t('stockTimeline.adjusted')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📦</span>
            <span>{t('stockTimeline.refilled')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⚠</span>
            <span>{t('stockTimeline.lost')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
