/**
 * Hook de alarme nativo Android para HoraMed
 * 
 * Garante alarmes confiÃ¡veis mesmo com:
 * - App fechado
 * - Modo aviÃ£o
 * - Economia de bateria
 * - Tela bloqueada
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { auth, db, fetchCollection, addDocument } from "@/integrations/firebase";
import { where, orderBy } from "@/integrations/firebase";
import { Dose } from "@/types/dose";
import { toast } from "sonner";
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";

// Notification channel ID - CRITICAL for Android alarm behavior
export const ALARM_CHANNEL_ID = "horamed_alarm";
export const ALARM_CHANNEL_NAME = "Alarmes de Medicamentos";

interface AlarmConfig {
  id: number;
  title: string;
  body: string;
  scheduledAt: Date;
  doseId: string;
  itemId: string;
  sound?: string;
  extra?: Record<string, unknown>;
}

interface AlarmLog {
  type: "scheduled" | "triggered" | "failed" | "push_received" | "permission_granted" | "permission_denied";
  alarmId?: string;
  doseId?: string;
  timestamp: Date;
  details?: string;
  success: boolean;
}

interface AlarmDiagnostics {
  lastAlarmTriggered: boolean | null;
  lastAlarmTime: Date | null;
  permissionStatus: "granted" | "denied" | "unknown";
  batteryOptimizationExempt: boolean | null;
  totalScheduled: number;
  totalTriggered: number;
  totalFailed: number;
}

export const useAndroidAlarm = () => {
  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === "android";
  const [diagnostics, setDiagnostics] = useState<AlarmDiagnostics>({
    lastAlarmTriggered: null,
    lastAlarmTime: null,
    permissionStatus: "unknown",
    batteryOptimizationExempt: null,
    totalScheduled: 0,
    totalTriggered: 0,
    totalFailed: 0,
  });
  const logsRef = useRef<AlarmLog[]>([]);
  const scheduledAlarmsRef = useRef<Set<string>>(new Set());

  /**
   * Log to Supabase notification_logs
   */
  const logToFirebase = useCallback(async (log: AlarmLog) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const base = `users/${user.uid}`;
      await addDocument(`${base}/notification_logs`, {
        userId: user.uid,
        doseId: log.doseId || null,
        notificationType: "local_alarm",
        title: log.type,
        body: log.details || "",
        scheduledAt: log.timestamp,
        deliveryStatus: log.success ? "delivered" : "failed",
        metadata: {
          alarmId: log.alarmId,
          platform: "android",
        },
      });
    } catch (error) {
      console.error("[AndroidAlarm] Error logging to Firebase:", error);
    }
  }, []);

  /**
   * Log alarm event for diagnostics
   */
  const logAlarmEvent = useCallback((log: AlarmLog) => {
    logsRef.current.push(log);

    // Keep only last 100 logs
    if (logsRef.current.length > 100) {
      logsRef.current = logsRef.current.slice(-100);
    }

    // Persist to localStorage
    try {
      localStorage.setItem("alarm_logs", JSON.stringify(logsRef.current));
    } catch (e) {
      // Ignore quota errors
    }

    // Also log to Firebase for analytics
    logToFirebase(log).catch(console.error);
  }, [logToFirebase]);

  /**
   * Initialize notification channel for Android
   * CRITICAL: Uses HIGH importance for alarm behavior
   */
  const initializeNotificationChannel = useCallback(async () => {
    if (!isNative || !isAndroid) return;

    try {
      // Create dedicated alarm channel with HIGH importance
      await LocalNotifications.createChannel({
        id: ALARM_CHANNEL_ID,
        name: ALARM_CHANNEL_NAME,
        description: "Alarmes importantes para lembrar de tomar medicamentos",
        importance: 5, // IMPORTANCE_HIGH - heads-up notification
        visibility: 1, // PUBLIC
        sound: "notification.wav",
        vibration: true,
        lights: true,
        lightColor: "#10B981",
      });


      // Also create a critical channel for urgent alarms
      await LocalNotifications.createChannel({
        id: "horamed_critical",
        name: "Alertas CrÃ­ticos",
        description: "Alertas crÃ­ticos que nÃ£o podem ser perdidos",
        importance: 5,
        visibility: 1,
        sound: "alarm.wav",
        vibration: true,
        lights: true,
        lightColor: "#EF4444",
      });

    } catch (error) {
      console.error("[AndroidAlarm] Error creating notification channel:", error);
      logAlarmEvent({
        type: "failed",
        timestamp: new Date(),
        details: `Failed to create channel: ${error}`,
        success: false,
      });
    }
  }, [isNative, isAndroid, logAlarmEvent]);

  /**
   * Check and request all necessary permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
      // Request local notification permissions
      const localResult = await LocalNotifications.requestPermissions();

      // Request push notification permissions
      let pushGranted = false;
      try {
        const pushResult = await PushNotifications.requestPermissions();
        pushGranted = pushResult.receive === "granted";

        if (pushGranted) {
          await PushNotifications.register();
        }

      } catch (e) {
        // Ignore initialization errors
      }

      const allGranted = localResult.display === "granted";

      setDiagnostics(prev => ({
        ...prev,
        permissionStatus: allGranted ? "granted" : "denied",
      }));

      logAlarmEvent({
        type: allGranted ? "permission_granted" : "permission_denied",
        timestamp: new Date(),
        success: allGranted,
        details: `Local: ${localResult.display}, Push: ${pushGranted}`,
      });

      if (allGranted) {
        await initializeNotificationChannel();
      }

      return allGranted;
    } catch (error) {
      console.error("[AndroidAlarm] Error requesting permissions:", error);
      setDiagnostics(prev => ({
        ...prev,
        permissionStatus: "denied",
      }));
      return false;
    }
  }, [isNative, initializeNotificationChannel, logAlarmEvent]);

  /**
   * Schedule a local alarm notification
   * Uses exact timing and high-priority channel
   */
  const scheduleAlarm = useCallback(async (config: AlarmConfig): Promise<boolean> => {
    if (!isNative) {
      return false;
    }

    const alarmKey = `${config.doseId}-${config.scheduledAt.getTime()}`;

    // Prevent duplicate scheduling
    if (scheduledAlarmsRef.current.has(alarmKey)) {
      return true;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: config.id,
            title: config.title,
            body: config.body,
            schedule: {
              at: config.scheduledAt,
              allowWhileIdle: true, // CRITICAL: Works in Doze mode
            },
            channelId: ALARM_CHANNEL_ID,
            smallIcon: "ic_stat_pill",
            largeIcon: "ic_launcher",
            sound: config.sound || "notification.wav",
            actionTypeId: "MEDICATION_ALARM",
            extra: {
              doseId: config.doseId,
              itemId: config.itemId,
              scheduledAt: config.scheduledAt,
              ...config.extra,
            },
            autoCancel: false,
          },
        ],
      });

      scheduledAlarmsRef.current.add(alarmKey);

      setDiagnostics(prev => ({
        ...prev,
        totalScheduled: prev.totalScheduled + 1,
      }));

      logAlarmEvent({
        type: "scheduled",
        alarmId: String(config.id),
        doseId: config.doseId,
        timestamp: new Date(),
        success: true,
        details: `Scheduled for ${config.scheduledAt.toISOString()}`,
      });


      return true;
    } catch (error) {
      console.error("[AndroidAlarm] Error scheduling alarm:", error);

      setDiagnostics(prev => ({
        ...prev,
        totalFailed: prev.totalFailed + 1,
      }));

      logAlarmEvent({
        type: "failed",
        alarmId: String(config.id),
        doseId: config.doseId,
        timestamp: new Date(),
        success: false,
        details: `Error: ${error}`,
      });

      return false;
    }
  }, [isNative, logAlarmEvent]);

  /**
   * Schedule alarms for all pending doses
   */
  const scheduleAllPendingDoses = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const now = new Date();
      const next24h = safeDateParse(now.getTime() + 24 * 60 * 60 * 1000);

      // In a real multi-profile scenario, we'd loop through profiles or use a root collection
      // For simplicity, we'll use the current active profile logic if possible, 
      // but useAndroidAlarm doesn't have access to activeProfile. 
      // We'll fetch from the user's root doses for now.
      const paths = { doses: `users/${user.uid}/doses` };

      const { data: doses } = await fetchCollection<Dose>(paths.doses, [
        where("status", "==", "scheduled"),
        where("dueAt", ">=", now.toISOString()),
        where("dueAt", "<=", next24h.toISOString()),
        orderBy("dueAt", "asc"),
      ]);

      if (doses && doses.length > 0) {
        for (const dose of doses) {
          const dueAt = safeDateParse(dose.dueAt || dose.due_at);

          // Generate unique ID from dose ID
          const notificationId = parseInt(dose.id.replace(/\D/g, "").slice(0, 8)) ||
            Math.floor(Math.random() * 100000);

          await scheduleAlarm({
            id: notificationId,
            title: "â° Hora do remÃ©dio!",
            body: `${dose.itemName || dose.items?.name}${dose.doseText || dose.items?.dose_text ? ` - ${dose.doseText || dose.items?.dose_text}` : ""}`,
            scheduledAt: dueAt,
            doseId: dose.id,
            itemId: dose.itemId || dose.item_id || "",
          });
        }
      }
    } catch (error) {
      console.error("[AndroidAlarm] Error scheduling all doses:", error);
    }
  }, [scheduleAlarm]);

  /**
   * Cancel a scheduled alarm
   */
  const cancelAlarm = useCallback(async (notificationId: number) => {
    if (!isNative) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    } catch (error) {
      console.error("[AndroidAlarm] Error cancelling alarm:", error);
    }
  }, [isNative]);

  /**
   * Cancel all scheduled alarms
   */
  const cancelAllAlarms = useCallback(async () => {
    if (!isNative) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
      scheduledAlarmsRef.current.clear();
    } catch (error) {
      console.error("[AndroidAlarm] Error cancelling all alarms:", error);
    }
  }, [isNative]);

  /**
   * Get alarm logs for diagnostics
   */
  const getAlarmLogs = useCallback((): AlarmLog[] => {
    return [...logsRef.current];
  }, []);

  /**
   * Get diagnostics status
   */
  const getDiagnostics = useCallback((): AlarmDiagnostics => {
    return { ...diagnostics };
  }, [diagnostics]);

  /**
   * Send test alarm (for testing purposes)
   */
  const sendTestAlarm = useCallback(async (delaySeconds: number = 10): Promise<boolean> => {
    const testTime = new Date(Date.now() + delaySeconds * 1000);
    const testId = Math.floor(Math.random() * 100000);


    const success = await scheduleAlarm({
      id: testId,
      title: "ðŸ§ª Teste de Alarme",
      body: "Se vocÃª recebeu isso, o alarme estÃ¡ funcionando!",
      scheduledAt: testTime,
      doseId: `test-${testId}`,
      itemId: `test-item-${testId}`,
    });

    if (success) {
      toast.info(`Alarme de teste agendado para ${delaySeconds} segundos`, {
        description: "Feche o app e aguarde...",
      });
    }

    return success;
  }, [scheduleAlarm]);

  /**
   * Check battery optimization status (Android specific)
   */
  const checkBatteryOptimization = useCallback(async (): Promise<boolean | null> => {
    if (!isAndroid) return null;
    // This would require a custom Capacitor plugin to check
    // For now, we'll assume it's not exempt and show the warning
    return false;
  }, [isAndroid]);

  // Initialize on mount
  useEffect(() => {
    if (!isNative || !isAndroid) return;

    // Load saved logs
    try {
      const savedLogs = localStorage.getItem("alarm_logs");
      if (savedLogs) {
        logsRef.current = JSON.parse(savedLogs);
      }
    } catch (e) {
      // Ignore parse errors
    }

    // Initialize channel and check permissions
    const init = async () => {
      const permissions = await LocalNotifications.checkPermissions();
      setDiagnostics(prev => ({
        ...prev,
        permissionStatus: permissions.display === "granted" ? "granted" : "denied",
      }));

      if (permissions.display === "granted") {
        await initializeNotificationChannel();
      }
    };

    init();

    // Listen for notification events
    const setupListeners = async () => {
      await LocalNotifications.addListener("localNotificationReceived", (notification) => {

        setDiagnostics(prev => ({
          ...prev,
          lastAlarmTriggered: true,
          lastAlarmTime: new Date(),
          totalTriggered: prev.totalTriggered + 1,
        }));

        logAlarmEvent({
          type: "triggered",
          alarmId: String(notification.id),
          doseId: notification.extra?.doseId,
          timestamp: new Date(),
          success: true,
          details: notification.title,
        });
      });

      await LocalNotifications.addListener("localNotificationActionPerformed", (action) => {

        // Handle action button clicks
        const doseId = action.notification.extra?.doseId;
        if (doseId) {
          // Dispatch event for other components to handle
          window.dispatchEvent(new CustomEvent("alarm-action", {
            detail: {
              doseId,
              actionId: action.actionId,
            },
          }));
        }
      });
    };

    setupListeners();

    return () => {
      LocalNotifications.removeAllListeners();
    };
  }, [isNative, isAndroid, initializeNotificationChannel, logAlarmEvent]);

  return {
    // State
    isAndroid,
    isNative,
    diagnostics,

    // Actions
    requestPermissions,
    scheduleAlarm,
    scheduleAllPendingDoses,
    cancelAlarm,
    cancelAllAlarms,
    sendTestAlarm,
    checkBatteryOptimization,

    // Diagnostics
    getAlarmLogs,
    getDiagnostics,
  };
};

export default useAndroidAlarm;

