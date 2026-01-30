import { useEffect, useRef, useCallback } from "react";
import { auth, db, addDocument, updateDocument, fetchCollection } from "@/integrations/firebase";
import { functions } from "@/integrations/firebase/client";
import { httpsCallable } from "firebase/functions";
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { useAuditLog } from "./useAuditLog";

interface ReminderData {
  doseId: string;
  itemId: string;
  title: string;
  body: string;
  scheduledAt: Date;
}

interface NotificationMetric {
  userId: string;
  doseId: string;
  notificationType: "push" | "local" | "web" | "sound" | "whatsapp";
  deliveryStatus: "sent" | "delivered" | "failed" | "fallback";
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

const STORAGE_KEY = "local_reminders_backup";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 60000; // 1 minute

// Singleton to prevent multiple initializations
let isInitialized = false;
let lastSyncTime = 0;
const SYNC_COOLDOWN = 30 * 60 * 1000; // 30 minutes between syncs

export const useResilientReminders = () => {
  const { logAction } = useAuditLog();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitializedRef = useRef(false);

  // Cleanup old localStorage reminders to prevent QuotaExceededError
  const cleanupLocalStorageReminders = useCallback(() => {
    try {
      const backupData = localStorage.getItem(STORAGE_KEY);
      if (backupData) {
        const reminders = JSON.parse(backupData);
        if (reminders.length > 100) {
          const sorted = reminders.sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted.slice(0, 50)));
        }
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Initialize - only once per app lifecycle with cooldown
  useEffect(() => {
    if (isInitialized || hasInitializedRef.current) return;

    const now = Date.now();
    if (now - lastSyncTime < SYNC_COOLDOWN) return;

    hasInitializedRef.current = true;
    isInitialized = true;
    lastSyncTime = now;

    // Run cleanup only, skip expensive sync on startup
    cleanupLocalStorageReminders();
    cleanupOldReminders().catch(console.error);

    // Check for pending retries every 30 minutes (reduced frequency)
    const interval = setInterval(() => {
      retryFailedReminders();
    }, 30 * RETRY_DELAY);

    return () => {
      clearInterval(interval);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [cleanupLocalStorageReminders]);

  /**
   * Schedule a reminder with automatic fallback and metrics
   */
  const scheduleReminder = async (data: ReminderData): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    let primarySuccess = false;
    let fallbackUsed = false;
    const errors: string[] = [];

    // Try primary method: Native notifications
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: data.title,
              body: data.body,
              id: generateNotificationId(data.doseId),
              schedule: { at: data.scheduledAt },
              sound: undefined,
              actionTypeId: "MEDICATION_REMINDER",
              extra: {
                doseId: data.doseId,
                itemId: data.itemId,
              },
            },
          ],
        });

        primarySuccess = true;
        await logMetric({
          userId: user.uid,
          doseId: data.doseId,
          notificationType: "local",
          deliveryStatus: "sent",
          metadata: { method: "native_capacitor" },
          createdAt: new Date().toISOString()
        });

        await logAction({
          action: "schedule_reminder",
          resource: "reminder",
          resource_id: data.doseId,
          metadata: { type: "native", title: data.title },
        });
      } catch (error) {
        errors.push(`Native: ${error instanceof Error ? error.message : "Unknown error"}`);
        await logMetric({
          userId: user.uid,
          doseId: data.doseId,
          notificationType: "local",
          deliveryStatus: "failed",
          errorMessage: errors[0],
          createdAt: new Date().toISOString()
        });
      }
    }

    // Try secondary method: Web notifications
    if (!primarySuccess && "Notification" in window) {
      try {
        if (Notification.permission === "granted") {
          // Schedule using setTimeout for web
          const delay = data.scheduledAt.getTime() - Date.now();
          if (delay > 0) {
            setTimeout(() => {
              new Notification(data.title, {
                body: data.body,
                icon: "/favicon.ico",
                tag: data.doseId,
                requireInteraction: true,
              });
            }, delay);

            primarySuccess = true;
            await logMetric({
              userId: user.uid,
              doseId: data.doseId,
              notificationType: "web",
              deliveryStatus: "sent",
              metadata: { method: "web_api" },
              createdAt: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        errors.push(`Web: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // Try WhatsApp as secondary fallback if primary methods failed
    if (!primarySuccess) {
      try {
        // Fetch preferences from Firestore
        const prefSnap = await getDocs(query(collection(db, 'users', user.uid, 'notificationPreferences')));
        // Assuming single doc or 'me' doc
        const preferences = prefSnap.empty ? null : prefSnap.docs[0].data();

        if (
          preferences?.whatsappEnabled &&
          preferences.whatsappNumber &&
          preferences.whatsappInstanceId &&
          preferences.whatsappApiToken
        ) {
          const sendWhatsappReminder = httpsCallable(functions, 'sendWhatsappReminder');
          await sendWhatsappReminder({
            phoneNumber: preferences.whatsappNumber,
            message: `🔔 ${data.title}\n\n${data.body}`,
            instanceId: preferences.whatsappInstanceId,
            apiToken: preferences.whatsappApiToken,
          });

          primarySuccess = true;
          fallbackUsed = true;
          await logMetric({
            userId: user.uid,
            doseId: data.doseId,
            notificationType: "whatsapp",
            deliveryStatus: "sent",
            metadata: { fallback_from: "push" },
            createdAt: new Date().toISOString()
          });

          await logAction({
            action: "whatsapp_fallback",
            resource: "reminder",
            resource_id: data.doseId,
            metadata: { title: data.title },
          });

        }
      } catch (error) {
        errors.push(`WhatsApp: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // Final Fallback: Save to local storage and database
    if (!primarySuccess) {
      fallbackUsed = true;
      await saveFallbackReminder(user.uid, data);

      await logMetric({
        userId: user.uid,
        doseId: data.doseId,
        notificationType: "local",
        deliveryStatus: "fallback",
        errorMessage: errors.join("; "),
        metadata: { fallback_reason: "all_methods_failed" },
        createdAt: new Date().toISOString()
      });

      await logAction({
        action: "fallback_reminder",
        resource: "reminder",
        resource_id: data.doseId,
        metadata: { errors, fallback: true },
      });

      console.warn("Using final fallback reminder storage:", errors);
    }

    return primarySuccess || fallbackUsed;
  };

  /**
   * Save reminder to fallback storage (localStorage + database)
   */
  const saveFallbackReminder = async (userId: string, data: ReminderData) => {
    // Save to localStorage
    const localBackup = localStorage.getItem(STORAGE_KEY);
    const reminders = localBackup ? JSON.parse(localBackup) : [];
    reminders.push({
      ...data,
      userId,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));

    // Save to database
    try {
      await addDocument(`users/${userId}/localReminders`, {
        doseId: data.doseId,
        scheduledAt: data.scheduledAt.toISOString(),
        notificationData: {
          title: data.title,
          body: data.body,
          itemId: data.itemId,
        },
        status: "pending",
        retryCount: 0,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving fallback to database:", error);
    }
  };


  /**
   * Retry failed reminders
   */
  const retryFailedReminders = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const overdueRef = collection(db, 'users', user.uid, 'localReminders');
      // "status" == "failed" AND retryCount < MAX
      // AND scheduledAt > now (future only)
      const q = query(
        overdueRef,
        where("status", "==", "failed"),
        where("retryCount", "<", MAX_RETRY_ATTEMPTS),
        where("scheduledAt", ">=", new Date().toISOString())
      );

      const failedMetaSnap = await getDocs(q);
      const failedReminders = failedMetaSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      if (failedReminders.length > 0) {
        console.log(`Retrying ${failedReminders.length} failed reminders`);

        for (const reminder of failedReminders) {
          const data = reminder.notificationData;
          const success = await scheduleReminder({
            doseId: reminder.doseId,
            itemId: data.itemId,
            title: data.title,
            body: data.body,
            scheduledAt: new Date(reminder.scheduledAt),
          });

          await updateDocument(`users/${user.uid}/localReminders`, reminder.id, {
            status: success ? "sent" : "failed",
            retryCount: (reminder.retryCount || 0) + 1,
            lastRetryAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error retrying failed reminders:", error);
    }
  };

  /**
   * Log notification metric
   */
  const logMetric = async (metric: NotificationMetric) => {
    try {
      await addDocument(`users/${metric.userId}/notificationMetrics`, metric);
    } catch (error) {
      console.error("Error logging notification metric:", error);
    }
  };

  /**
   * Get notification statistics
   */
  const getNotificationStats = async (days: number = 7) => {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metricsRef = collection(db, 'users', user.uid, 'notificationMetrics');
      const q = query(metricsRef, where('createdAt', '>=', startDate.toISOString()));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => d.data()) as any[];

      if (!data) return null;

      const stats = {
        total: data.length,
        sent: data.filter(m => m.deliveryStatus === "sent").length,
        delivered: data.filter(m => m.deliveryStatus === "delivered").length,
        failed: data.filter(m => m.deliveryStatus === "failed").length,
        fallback: data.filter(m => m.deliveryStatus === "fallback").length,
        byType: {
          push: data.filter(m => m.notificationType === "push").length,
          local: data.filter(m => m.notificationType === "local").length,
          web: data.filter(m => m.notificationType === "web").length,
          sound: data.filter(m => m.notificationType === "sound").length,
        },
        successRate: data.length > 0
          ? ((data.filter(m => m.deliveryStatus === "sent" || m.deliveryStatus === "delivered").length / data.length) * 100).toFixed(1)
          : "0",
      };

      return stats;
    } catch (error) {
      console.error("Error getting notification stats:", error);
      return null;
    }
  };

  /**
   * Generate consistent notification ID from dose ID
   */
  const generateNotificationId = (doseId: string): number => {
    return parseInt(doseId.replace(/\D/g, "").slice(0, 8)) || Math.floor(Math.random() * 100000);
  };

  /**
   * Clear old completed reminders
   */
  const cleanupOldReminders = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep 7 days of history

      // Delete old local reminders
      const remindersRef = collection(db, 'users', user.uid, 'localReminders');
      const qReminders = query(
        remindersRef,
        where("status", "==", "sent"),
        where("scheduledAt", "<", cutoffDate.toISOString())
      );
      const snapReminders = await getDocs(qReminders);
      snapReminders.forEach(async (d) => await deleteDoc(doc(db, 'users', user.uid, 'localReminders', d.id)));


      // Delete old metrics
      const metricsRef = collection(db, 'users', user.uid, 'notificationMetrics');
      const qMetrics = query(metricsRef, where("createdAt", "<", cutoffDate.toISOString()));
      const snapMetrics = await getDocs(qMetrics);
      snapMetrics.forEach(async (d) => await deleteDoc(doc(db, 'users', user.uid, 'notificationMetrics', d.id)));

    } catch (error) {
      console.error("Error cleaning up old reminders:", error);
    }
  };

  return {
    scheduleReminder,
    getNotificationStats,
    cleanupOldReminders,
    retryFailedReminders,
  };
};
