import { useQuery } from "@tanstack/react-query";
import { auth, db, addDocument } from "@/integrations/firebase";
import { collection as firestoreCollection, query as firestoreQuery, where as firestoreWhere, getDocs as firestoreGetDocs } from "firebase/firestore";

interface NotificationStats {
  total: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  channelBreakdown: {
    push: { total: number; success: number };
    email: { total: number; success: number };
    web_push: { total: number; success: number };
  };
}

export function useNotificationMetrics(days: number = 7) {
  const user = auth.currentUser;

  return useQuery({
    queryKey: ["notification-metrics", user?.uid, days],
    queryFn: async (): Promise<NotificationStats> => {
      // Need re-check user because hook might run when auth is initializing
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch from Firestore
      const metricsRef = firestoreCollection(db, 'users', currentUser.uid, 'notificationMetrics');
      const q = firestoreQuery(metricsRef, firestoreWhere('createdAt', '>=', startDate.toISOString()));
      const snap = await firestoreGetDocs(q);

      const metrics = snap.docs.map(doc => doc.data());

      const total = metrics.length;
      const delivered = metrics.filter(m => m.deliveryStatus === "delivered").length;
      const failed = metrics.filter(m => m.deliveryStatus === "failed").length;
      const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;

      // Parse channel breakdown from metadata
      const channelBreakdown = {
        push: { total: 0, success: 0 },
        email: { total: 0, success: 0 },
        web_push: { total: 0, success: 0 },
      };

      metrics.forEach(m => {
        const metadata = m.metadata as Record<string, unknown> | null;
        const channels = (metadata?.channels as Array<{ channel: string; success: boolean }>) || [];
        channels.forEach(ch => {
          if (ch.channel in channelBreakdown) {
            const key = ch.channel as keyof typeof channelBreakdown;
            channelBreakdown[key].total++;
            if (ch.success) channelBreakdown[key].success++;
          }
        });
      });

      return {
        total,
        delivered,
        failed,
        deliveryRate,
        channelBreakdown,
      };
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export async function trackNotificationEvent(
  eventName: string,
  eventData: Record<string, any> = {}
) {
  const user = auth.currentUser;
  if (!user) return;

  // Fire and forget mechanism
  try {
    await addDocument(`users/${user.uid}/appMetrics`, {
      eventName,
      eventData,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to track metric", e);
  }
}

// Telemetry events for tracking
export const NotificationEvents = {
  PERMISSION_REQUESTED: 'notification_permission_requested',
  PERMISSION_GRANTED: 'notification_permission_granted',
  PERMISSION_DENIED: 'notification_permission_denied',
  FIRST_NOTIFICATION_SENT: 'first_notification_sent',
  NOTIFICATION_CLICKED: 'notification_clicked',
  NOTIFICATION_DISMISSED: 'notification_dismissed',
} as const;
