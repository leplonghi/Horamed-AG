import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { WarningCircle as AlertCircle, CheckCircle as CheckCircle2, Clock, XCircle } from "@phosphor-icons/react";
import { useLanguage } from "@/contexts/LanguageContext";

interface NotificationMetric {
  notification_type: string;
  delivery_status: string;
  count: number;
}

export default function NotificationMetrics() {
  const [metrics, setMetrics] = useState<NotificationMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const db = getFirestore();
      const metricsQuery = query(
        collection(db, 'notification_metrics'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(metricsQuery);
      const data = snapshot.docs.map(doc => doc.data());

      // Aggregate metrics
      const aggregated = data.reduce((acc, item) => {
        const key = `${item.notificationType}-${item.deliveryStatus}`;
        if (!acc[key]) {
          acc[key] = {
            notification_type: item.notificationType,
            delivery_status: item.deliveryStatus,
            count: 0
          };
        }
        acc[key].count++;
        return acc;
      }, {} as Record<string, NotificationMetric>);

      setMetrics(Object.values(aggregated || {}));
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const totalDelivered = metrics.filter(m => m.delivery_status === 'delivered').reduce((sum, m) => sum + m.count, 0);
  const totalFailed = metrics.filter(m => m.delivery_status === 'failed').reduce((sum, m) => sum + m.count, 0);
  const total = totalDelivered + totalFailed;
  const deliveryRate = total > 0 ? ((totalDelivered / total) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">{t('notifMetrics.loading')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">{t('notifMetrics.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('notifMetrics.deliveryRate')}: <span className="font-semibold text-foreground">{deliveryRate}%</span>
          {total > 0 && ` (${totalDelivered}/${total})`}
        </p>
      </div>

      <div className="space-y-2">
        {metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('notifMetrics.noMetrics')}</p>
        ) : (
          metrics.map((metric, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(metric.delivery_status)}
                <div>
                  <p className="text-sm font-medium capitalize">{metric.notification_type}</p>
                  <p className="text-xs text-muted-foreground capitalize">{metric.delivery_status}</p>
                </div>
              </div>
              <span className="text-sm font-semibold">{metric.count}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}