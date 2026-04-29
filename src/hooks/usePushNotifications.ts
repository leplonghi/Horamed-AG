import { useEffect, useState, useCallback, useRef } from "react";
import { PushNotifications, ActionPerformed } from "@capacitor/push-notifications";
import { LocalNotifications, LocalNotificationSchema, ScheduleEvery } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  auth,
  functions,
  httpsCallable,
  fetchCollection,
  fetchDocument,
  setDocument,
  addDocument,
  updateDocument,
  query,
  where,
  orderBy
} from "@/integrations/firebase";
import { safeDateParse } from "@/lib/safeDateUtils";
import { useNavigate } from "react-router-dom";
import { addMinutes, addHours, subMinutes } from "date-fns";
import { useNotificationTypes } from "./useNotificationTypes";
import { safeParseDoseDate } from "@/types";

// Check if running on native platform
const isNativePlatform = Capacitor.isNativePlatform();

interface QuietHours {
  enabled: boolean;
  startTime: string; // "22:00"
  endTime: string; // "06:00"
}

interface OfflineAction {
  id: string;
  doseId: string;
  action: 'taken' | 'snooze' | 'skip';
  timestamp: string;
  synced: boolean;
}

interface NotifMedicationDoc {
  id: string;
  name: string;
  doseText?: string;
  dose_text?: string;
  category?: string;
  notes?: string;
  notificationType?: string;
  isActive?: boolean;
}

interface NotifDoseDoc {
  id: string;
  itemId: string;
  status: string;
  dueAt: string;
}

interface DoseWithItem extends NotifDoseDoc {
  item: NotifMedicationDoc;
}

interface DoseActionResponse {
  message?: string;
  streak?: number;
}

// Notification channel ID for Android
const CHANNEL_ID = "horamed-medicamentos";

function normalizeAlertMinutes(minutes: unknown): number[] {
  if (!Array.isArray(minutes)) return [15, 5, 0];

  const normalized = minutes
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0);

  const unique = Array.from(new Set(normalized));
  if (!unique.includes(0)) unique.push(0);

  return unique.sort((a, b) => b - a);
}

function createNotificationId(key: string) {
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) | 0;
  }

  return Math.abs(hash) % 2147483647;
}

export const usePushNotifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getNotificationType } = useNotificationTypes();
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: false,
    startTime: "22:00",
    endTime: "06:00"
  });
  const listenerHandlesRef = useRef<Array<{ remove: () => Promise<void> }>>([]);
  const webTimeoutsRef = useRef<number[]>([]);




  // Setup Android notification channels and iOS action categories
  const setupNotificationChannels = async () => {
    // Skip on web - channels are only for native
    if (!isNativePlatform) {
      return;
    }

    try {
      // Create notification channel for Android
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: "Lembretes de Medicamentos",
        description: "NotificaÃ§Ãµes para lembrar de tomar medicamentos",
        importance: 5, // IMPORTANCE_HIGH
        visibility: 1, // PUBLIC
        sound: "default",
        vibration: true,
        lights: true,
        lightColor: "#10B981", // Green
      });

      // Register action types for notification buttons
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: "DOSE_REMINDER",
            actions: [
              {
                id: "taken",
                title: "âœ“ Tomei",
                foreground: true,
              },
              {
                id: "snooze",
                title: "â° 15 min",
                foreground: false,
              },
              {
                id: "skip",
                title: "â†’ Pular",
                foreground: false,
                destructive: true,
              },
            ],
          },
          {
            id: "DAILY_SUMMARY",
            actions: [
              {
                id: "view",
                title: "ðŸ“Š Ver Resumo",
                foreground: true,
              },
            ],
          },
        ],
      });

    } catch (error) {
      console.error("Error setting up notification channels:", error);
    }
  };

  const isInQuietHours = (date: Date): boolean => {
    if (!quietHours.enabled) return false;

    const hour = date.getHours();
    const minute = date.getMinutes();

    const [startH, startM] = quietHours.startTime.split(':').map(Number);
    const [endH, endM] = quietHours.endTime.split(':').map(Number);

    const currentMinutes = hour * 60 + minute;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Handle overnight quiet hours (e.g., 22:00 to 06:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  // Helper to convert base64 to Uint8Array for VAPID key
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Get application server key - returns the Uint8Array directly (compatible with applicationServerKey)
  const getApplicationServerKey = (base64String: string): Uint8Array<ArrayBuffer> => {
    const uint8Array = urlBase64ToUint8Array(base64String);
    // Create a new Uint8Array backed by a proper ArrayBuffer
    const buffer = new ArrayBuffer(uint8Array.length);
    const view = new Uint8Array(buffer);
    const dest = new Uint8Array(view.buffer);
    dest.set(uint8Array);
    return view;
  };

  // Subscribe to web push notifications
  const subscribeToWebPush = async (): Promise<boolean> => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false;
      }

      const user = auth.currentUser;
      if (!user) {
        return false;
      }

      // VAPID key is public — read directly from env instead of a Cloud Function call
      const vapidPublicKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

      if (!vapidPublicKey) {
        console.error("[Web Push] VITE_FIREBASE_VAPID_KEY not set — web push disabled");
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription with proper ArrayBuffer
        const applicationServerKey = getApplicationServerKey(vapidPublicKey);

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        });
      }


      // Extract subscription details
      const subscriptionJson = subscription.toJSON();
      const endpoint = subscription.endpoint;
      const p256dh = subscriptionJson.keys?.p256dh || '';
      const authKey = subscriptionJson.keys?.auth || '';

      // Save to push_subscriptions collection in Firestore
      // Check if exists first to simulate upsert logic
      const { data: existingSubs } = await fetchCollection(
        `users/${user.uid}/pushSubscriptions`,
        [where('endpoint', '==', endpoint)]
      );

      if (existingSubs && existingSubs.length > 0) {
        await updateDocument(`users/${user.uid}/pushSubscriptions`, existingSubs[0].id, {
          p256dh,
          auth: authKey,
          userAgent: navigator.userAgent,
          updatedAt: new Date(),
        });
      } else {
        await addDocument(`users/${user.uid}/pushSubscriptions`, {
          endpoint,
          p256dh,
          auth: authKey,
          userAgent: navigator.userAgent,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Also update notification_preferences
      await setDocument(`users/${user.uid}/notificationPreferences`, 'current', {
        pushEnabled: true,
        pushToken: endpoint.substring(0, 255), // Store endpoint as token for tracking
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("[Web Push] Error subscribing:", error);
      return false;
    }
  };

  const clearScheduledWebNotifications = useCallback(() => {
    webTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    webTimeoutsRef.current = [];
  }, []);

  const loadAlertMinutes = useCallback(async (): Promise<number[]> => {
    const localAlarmSettings = localStorage.getItem("alarmSettings");
    if (localAlarmSettings) {
      try {
        const parsed = JSON.parse(localAlarmSettings);
        if (Array.isArray(parsed?.alertMinutes)) {
          return normalizeAlertMinutes(parsed.alertMinutes);
        }

        if (typeof parsed?.alertMinutes === "number") {
          return normalizeAlertMinutes([parsed.alertMinutes, 0]);
        }
      } catch (error) {
        console.error("Error reading local alarm settings:", error);
      }
    }

    const currentUser = auth.currentUser;
    if (!currentUser) return [15, 5, 0];

    const { data: preferences } = await fetchDocument<{ alertMinutes?: number[] }>(
      `users/${currentUser.uid}/notificationPreferences`,
      "current",
    );

    return normalizeAlertMinutes(preferences?.alertMinutes);
  }, []);

  // Initialize Web Push notifications
  const initializeWebPushNotifications = async () => {
    try {
      if (!('Notification' in window)) {
        return;
      }

      // Check current permission status
      const currentPermission = Notification.permission;

      if (currentPermission === 'granted') {
        // Already have permission, subscribe to push and schedule
        await subscribeToWebPush();
        scheduleWebNotifications();
      } else if (currentPermission === 'denied') {
        // Don't prompt - user already denied
      } else {
        // Permission is 'default' - wait for user action
        window.dispatchEvent(new CustomEvent('notification-permission-needed'));
      }
    } catch (error) {
      console.error("Error initializing web notifications:", error);
    }
  };

  // Public method to request permission (must be called from user interaction)
  const requestNotificationPermission = async () => {
    // Web Platform
    if (!isNativePlatform) {
      // Check if browser supports notifications
      if (!("Notification" in window)) {
        toast.error("Este navegador nÃ£o suporta notificaÃ§Ãµes.");
        return false;
      }

      try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          toast.success("NotificaÃ§Ãµes ativadas!");

          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            console.log('[Web] Service Worker ready for notifications:', registration);
          }

          await subscribeToWebPush();
          await scheduleWebNotifications();

          return true;
        } else {
          toast.error("PermissÃ£o de notificaÃ§Ã£o negada.");
          return false;
        }
      } catch (error) {
        console.error("Error requesting web permissions:", error);
        toast.error("Erro ao solicitar permissÃµes.");
        return false;
      }
    }

    // Native Platform (Android/iOS)
    try {
      const result = await PushNotifications.requestPermissions();
      if (result.receive === "granted") {
        await PushNotifications.register();
        await setupNotificationChannels();
        await scheduleNext48Hours();
        return true;
      } else {
        toast.error("PermissÃ£o de notificaÃ§Ã£o necessÃ¡ria");
        return false;
      }
    } catch (error) {
      console.error("Error requesting native permissions:", error);
      toast.error("Erro ao ativar notificaÃ§Ãµes");
      return false;
    }
  };

  // Helper to fetch doses with items
  const fetchDosesWithItems = async (start: Date, end: Date) => {
    const user = auth.currentUser;
    if (!user) return [];

    // 1. Fetch active items
    const { data: items } = await fetchCollection<NotifMedicationDoc>(
      `users/${user.uid}/medications`,
      [where('isActive', '==', true)]
    );

    const itemsMap = new Map(items?.map(i => [i.id, i]));

    // 2. Fetch doses
    const { data: doses } = await fetchCollection<NotifDoseDoc>(
      "dose_instances",
      [where("userId", "==", user.uid), 
        where('status', '==', 'scheduled'),
        where('dueAt', '>=', start.toISOString()),
        where('dueAt', '<=', end.toISOString()),
        orderBy('dueAt', 'asc') // Firestore requires composite index for this
      ]
    );

    // 3. Join
    return (doses?.map(dose => ({
      ...dose,
      item: itemsMap.get(dose.itemId)
    })).filter((d): d is DoseWithItem => !!d.item) || []) as DoseWithItem[];
  };

  // Schedule web notifications using the browser API with time-based types
  const scheduleWebNotifications = async () => {
    clearScheduledWebNotifications();

    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get doses for next 24 hours
      const now = new Date();
      const end24h = addHours(now, 24);

      const doses = await fetchDosesWithItems(now, end24h);

      if (!doses || doses.length === 0) return;

      const alertMinutes = await loadAlertMinutes();

      // Schedule notifications using setTimeout
      doses.forEach((dose: DoseWithItem) => {
        const itemData = dose.item;
        const dueDate = safeDateParse(dose.dueAt);
        const notificationConfig = getNotificationType(dueDate, {
          category: itemData.category,
          notes: itemData.notes,
          notification_type: itemData.notificationType,
        });

        const hour = dueDate.getHours();
        const timeEmoji = hour >= 5 && hour < 12 ? 'ðŸŒ…' :
          hour >= 12 && hour < 18 ? 'â˜€ï¸' :
            hour >= 18 && hour < 21 ? 'ðŸŒ†' : 'ðŸŒ™';

        alertMinutes.forEach((minutesBefore) => {
          const scheduledAt = minutesBefore > 0 ? subMinutes(dueDate, minutesBefore) : dueDate;
          const timeUntilNotification = scheduledAt.getTime() - now.getTime();

          if (timeUntilNotification <= 0 || isInQuietHours(scheduledAt)) {
            return;
          }

          const title = minutesBefore === 0
            ? `${timeEmoji} ${notificationConfig.title}`
            : `â° ${itemData.name} em ${minutesBefore} min`;

          const body = minutesBefore === 0
            ? `${itemData.name}${itemData.doseText ? ` - ${itemData.doseText}` : ''}`
            : `${itemData.doseText || 'Prepare sua prÃ³xima dose.'}`;

          const timeoutId = window.setTimeout(() => {
            if (Notification.permission === 'granted' && !isInQuietHours(new Date())) {
              const notification = new Notification(title, {
                body,
                icon: '/favicon.png',
                tag: `dose-${dose.id}-${minutesBefore}`,
                requireInteraction:
                  minutesBefore === 0 &&
                  (notificationConfig.type === 'urgent' || notificationConfig.type === 'critical'),
                silent: minutesBefore > 0 || notificationConfig.type === 'gentle',
              });

              notification.onclick = () => {
                window.focus();
                navigate("/hoje");
                notification.close();
              };

              if (minutesBefore === 0 && notificationConfig.repeatInterval) {
                const repeatTimeoutId = window.setTimeout(() => {
                  checkAndRepeatNotification(dose.id, itemData.name, notificationConfig);
                }, notificationConfig.repeatInterval * 60 * 1000);

                webTimeoutsRef.current.push(repeatTimeoutId);
              }
            }
          }, timeUntilNotification);

          webTimeoutsRef.current.push(timeoutId);
        });
      });

    } catch (error) {
      console.error("Error scheduling web notifications:", error);
    }
  };

  // Check if dose is still pending and repeat notification
  const checkAndRepeatNotification = async (
    doseId: string,
    itemName: string,
    config: { title: string; type: string; repeatInterval?: number }
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { data: dose } = await fetchDocument<NotifDoseDoc>("dose_instances", doseId);

      if (dose?.status === 'scheduled') {
        // Dose still not taken, repeat notification
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(`âš ï¸ Lembrete: ${config.title}`, {
            body: `VocÃª ainda nÃ£o tomou ${itemName}`,
            icon: '/favicon.png',
            tag: `dose-repeat-${doseId}`,
            requireInteraction: true,
          });

          notification.onclick = () => {
            window.focus();
            navigate("/hoje");
            notification.close();
          };

          // Schedule another repeat if still critical
          if (config.repeatInterval) {
            setTimeout(() => {
              checkAndRepeatNotification(doseId, itemName, config);
            }, config.repeatInterval * 60 * 1000);
          }
        }
      }
    } catch (error) {
      console.error("Error checking dose status for repeat:", error);
    }
  };

  const initializePushNotifications = async () => {
    // Use web notifications for browsers, native for apps
    if (!isNativePlatform) {
      await initializeWebPushNotifications();
      return;
    }

    try {

      // Check current permission status first
      let currentPushStatus;
      let currentLocalStatus;

      try {
        currentPushStatus = await PushNotifications.checkPermissions();
        currentLocalStatus = await LocalNotifications.checkPermissions();
      } catch (checkError) {
        console.error("[Push] Error checking permissions:", checkError);
        // Assume we need to request permissions
        currentPushStatus = { receive: 'prompt' as const };
        currentLocalStatus = { display: 'prompt' as const };
      }

      // ALWAYS request Push Notifications permission if not granted
      if (currentPushStatus.receive !== "granted") {
        try {
          const pushPermStatus = await PushNotifications.requestPermissions();

          if (pushPermStatus.receive === "granted") {
            await PushNotifications.register();
            toast.success("âœ“ NotificaÃ§Ãµes push ativadas!", { duration: 2000 });
          } else if (pushPermStatus.receive === "denied") {
            const deniedEvent = new CustomEvent('native-notification-denied');
            window.dispatchEvent(deniedEvent);
          }
        } catch (permError) {
          console.error("[Push] Error requesting push permission:", permError);
        }
      } else {
        // Already have permission, just register
        try {
          await PushNotifications.register();
        } catch (regError) {
          console.error("[Push] Error registering:", regError);
        }
      }

      // ALWAYS request Local Notifications permission if not granted
      if (currentLocalStatus.display !== "granted") {
        try {
          await LocalNotifications.requestPermissions();
        } catch (localError) {
          console.error("[Push] Error requesting local permission:", localError);
        }
      }

      const registrationHandle = await PushNotifications.addListener("registration", async (token) => {
        await savePushToken(token.value);
        await scheduleNext48Hours();
      });
      listenerHandlesRef.current.push(registrationHandle);

      const registrationErrorHandle = await PushNotifications.addListener("registrationError", (error) => {
        console.error("[Push] Registration error:", error);
      });
      listenerHandlesRef.current.push(registrationErrorHandle);

      // Handle push notifications received (foreground)
      const receivedHandle = await PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          if (!isInQuietHours(new Date())) {
            toast.info(notification.title || "ðŸ’Š Lembrete de Medicamento", {
              description: notification.body,
              duration: 5000,
            });
          }
        }
      );
      listenerHandlesRef.current.push(receivedHandle);

      // Handle notification action
      const actionHandle = await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        async (action: ActionPerformed) => {
          handleNotificationAction(action);
        }
      );
      listenerHandlesRef.current.push(actionHandle);

      // Handle local notification actions
      const localActionHandle = await LocalNotifications.addListener(
        "localNotificationActionPerformed",
        async (action) => {
          // Adapt local notification action to push ActionPerformed shape
          const adapted: ActionPerformed = {
            actionId: action.actionId,
            inputValue: action.inputValue,
            notification: {
              id: String(action.notification.id),
              data: action.notification.extra || {},
            },
          };
          handleNotificationAction(adapted);
        }
      );
      listenerHandlesRef.current.push(localActionHandle);

    } catch (error) {
      console.error("[Push] Error initializing:", error);
    }
  };

  const handleNotificationAction = async (action: ActionPerformed) => {
    const actionId = action.actionId;
    const doseId = action.notification.data?.doseId;

    if (actionId === 'taken' && doseId) {
      await handleDoseAction(doseId, 'taken');
    } else if (actionId === 'snooze' && doseId) {
      await handleDoseAction(doseId, 'snooze');
    } else if (actionId === 'skip' && doseId) {
      await handleDoseAction(doseId, 'skip');
    } else {
      navigate("/hoje");
    }
  };

  const handleDoseAction = async (doseId: string, action: 'taken' | 'snooze' | 'skip') => {
    try {
      // Check if online
      const isOnline = navigator.onLine;

      if (!isOnline) {
        saveOfflineAction(doseId, action);
        toast.info(`â¸ï¸ AÃ§Ã£o salva (offline). SincronizarÃ¡ quando conectar.`, { duration: 3000 });
        return;
      }

      const handleDoseActionFn = httpsCallable<{ doseId: string; action: string }, DoseActionResponse>(functions, 'handleDoseAction');
      const { data } = await handleDoseActionFn({
        doseId,
        action
      });

      if (action === 'taken') {
        toast.success(data.message || 'âœ… Dose marcada!', {
          description: data.streak > 3 ? `ðŸ”¥ ${data.streak} dias seguidos!` : undefined,
          duration: 3000
        });
      } else if (action === 'snooze') {
        toast.info(data.message || 'â° Lembrete adiado 15 minutos', { duration: 2000 });
        await scheduleSnoozeNotification(doseId, 15);
      } else if (action === 'skip') {
        toast.info('â†’ Dose pulada', { duration: 2000 });
      }
    } catch (error) {
      console.error('Error handling dose action:', error);
      saveOfflineAction(doseId, action);
      toast.error('Erro. Salvamos sua aÃ§Ã£o e tentaremos novamente.', { duration: 3000 });
    }
  };

  const saveOfflineAction = (doseId: string, action: 'taken' | 'snooze' | 'skip') => {
    const actions = getOfflineActions();
    const newAction: OfflineAction = {
      id: Date.now().toString(),
      doseId,
      action,
      timestamp: new Date(),
      synced: false
    };
    actions.push(newAction);
    localStorage.setItem('offline_dose_actions', JSON.stringify(actions));
  };

  const getOfflineActions = (): OfflineAction[] => {
    const stored = localStorage.getItem('offline_dose_actions');
    return stored ? JSON.parse(stored) : [];
  };

  const syncOfflineActions = async () => {
    if (!navigator.onLine) return;

    const actions = getOfflineActions();
    const unsyncedActions = actions.filter(a => !a.synced);

    if (unsyncedActions.length === 0) return;


    for (const action of unsyncedActions) {
      try {
        const handleDoseActionFn = httpsCallable(functions, 'handleDoseAction');
        await handleDoseActionFn({
          doseId: action.doseId,
          action: action.action,
          timestamp: action.timestamp
        });

        // Mark as synced
        action.synced = true;

      } catch (error) {
        console.error('Error syncing action:', error);
      }
    }

    // Update localStorage
    localStorage.setItem('offline_dose_actions', JSON.stringify(actions));

    // Clean up old synced actions
    const cleanedActions = actions.filter(a => {
      if (a.synced) {
        const actionDate = safeDateParse(a.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return actionDate > weekAgo;
      }
      return true;
    });
    localStorage.setItem('offline_dose_actions', JSON.stringify(cleanedActions));
  };

  const scheduleNext48Hours = async () => {
    // On web, use the web notification scheduler
    if (!isNativePlatform) {
      await scheduleWebNotifications();
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get doses for next 48 hours
      const now = new Date();
      const end48h = addHours(now, 48);

      const doses = await fetchDosesWithItems(now, end48h);

      if (!doses || doses.length === 0) return;

      const alertMinutes = await loadAlertMinutes();

      // Cancel all pending local notifications first
      const pending = await LocalNotifications.getPending();
      if (pending.notifications && pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }

      // Schedule new notifications with time-based types
      const notifications = doses.flatMap((dose: DoseWithItem) => {
        const dueDate = safeDateParse(dose.dueAt);
        const itemData = dose.item;

        // Get notification type based on time and medication
        const notificationConfig = getNotificationType(dueDate, {
          category: itemData.category || null,
          notes: itemData.notes || null,
          notification_type: itemData.notificationType || null,
        });

        const hour = dueDate.getHours();
        const timeEmoji = hour >= 5 && hour < 12 ? 'ðŸŒ…' :
          hour >= 12 && hour < 18 ? 'â˜€ï¸' :
            hour >= 18 && hour < 21 ? 'ðŸŒ†' : 'ðŸŒ™';

        return alertMinutes
          .map((minutesBefore) => {
            const scheduledAt = minutesBefore > 0 ? subMinutes(dueDate, minutesBefore) : dueDate;

            if (!itemData || scheduledAt <= now || isInQuietHours(scheduledAt)) {
              return null;
            }

            const isExactTime = minutesBefore === 0;
            const title = isExactTime
              ? `${timeEmoji} ${notificationConfig.title}`
              : `â° ${itemData.name} em ${minutesBefore} min`;

            const body = isExactTime
              ? `${itemData.name}${itemData.doseText ? ` - ${itemData.doseText}` : ''}`
              : `${itemData.doseText || 'Prepare sua prÃ³xima dose.'}`;

            return {
              id: createNotificationId(`${dose.id}-${minutesBefore}`),
              title,
              body,
              largeBody: isExactTime
                ? `EstÃ¡ na hora de tomar ${itemData.name}.${itemData.doseText ? `\nDose: ${itemData.doseText}` : ''}`
                : `Seu lembrete de ${itemData.name} serÃ¡ em ${minutesBefore} minutos.`,
              summaryText: "HoraMed",
              schedule: { at: scheduledAt },
              channelId: CHANNEL_ID,
              actionTypeId: "DOSE_REMINDER",
              extra: {
                doseId: dose.id,
                itemName: itemData.name,
                type: isExactTime ? "dose_reminder" : "dose_reminder_early",
                notificationType: notificationConfig.type,
                minutesBefore,
              },
              smallIcon: "ic_stat_pill",
              largeIcon: "ic_launcher",
              iconColor: notificationConfig.color,
              sound: notificationConfig.sound === 'default' ? 'default' : notificationConfig.sound,
              ongoing: isExactTime && notificationConfig.type === 'critical',
              autoCancel: !isExactTime || notificationConfig.type !== 'critical',
              group: "dose-reminders",
            } satisfies LocalNotificationSchema;
          })
          .filter((notification): notification is LocalNotificationSchema => notification !== null);
      });

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
      }
    } catch (error) {
      console.error("Error scheduling notifications:", error);
    }
  };

  const scheduleSnoozeNotification = async (doseId: string, minutes: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { data: dose } = await fetchDocument<NotifDoseDoc>("dose_instances", doseId);
      if (!dose) return;

      const { data: itemData } = await fetchDocument<NotifMedicationDoc>(`users/${user.uid}/medications`, dose.itemId);

      const snoozeTime = addMinutes(new Date(), minutes);

      // Handle web snooze notifications
      if (!isNativePlatform) {
        const timeUntilSnooze = snoozeTime.getTime() - Date.now();
        setTimeout(() => {
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`â° Lembrete Adiado`, {
              body: `${itemData?.name || 'Medicamento'}${itemData?.doseText ? ` - ${itemData.doseText}` : ''}`,
              icon: '/favicon.png',
              tag: `snooze-${doseId}`,
              requireInteraction: true,
            });
            notification.onclick = () => {
              window.focus();
              navigate("/hoje");
              notification.close();
            };
          }
        }, timeUntilSnooze);
        return;
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: `â° Lembrete Adiado`,
          body: `${itemData?.name || 'Medicamento'}${itemData?.doseText ? ` - ${itemData.doseText}` : ''}`,
          largeBody: `VocÃª adiou este lembrete. Hora de tomar ${itemData?.name || 'seu medicamento'}.`,
          summaryText: "HoraMed",
          schedule: { at: snoozeTime },
          channelId: CHANNEL_ID,
          actionTypeId: "DOSE_REMINDER",
          extra: {
            doseId: dose.id,
            itemName: itemData?.name,
            type: "dose_reminder_snooze",
          },
          smallIcon: "ic_stat_pill",
          iconColor: "#F59E0B",
          sound: "default",
          autoCancel: true,
        }]
      });

    } catch (error) {
      console.error("Error scheduling snooze notification:", error);
    }
  };

  const savePushToken = async (token: string, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000;

    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn("[PushToken] No user found, will retry on auth change");
        return;
      }


      // 1. Save to preferences (Detailed)
      await setDocument(`users/${user.uid}/notificationPreferences`, 'current', {
        pushToken: token,
        pushEnabled: true,
        updatedAt: new Date().toISOString()
      });

      // 2. Save to ROOT user document (For Backend/Cloud Functions access)
      // The backend scheduleDoseNotifications looks for userDoc.data()?.pushToken
      await updateDocument('users', user.uid, {
        pushToken: token,
        updatedAt: new Date().toISOString()
      });


    } catch (error) {
      console.error("[PushToken] Exception:", error);

      if (retryCount < MAX_RETRIES) {
        setTimeout(() => savePushToken(token, retryCount + 1), RETRY_DELAY);
      }
    }
  };

  const checkPermissions = async (): Promise<boolean> => {
    if (!isNativePlatform) {
      if (!('Notification' in window)) return false;
      return Notification.permission === 'granted';
    }

    try {
      const permStatus = await PushNotifications.checkPermissions();
      return permStatus.receive === "granted";
    } catch (error) {
      console.error("Error checking permissions:", error);
      return false;
    }
  };

  const scheduleDailySummary = async () => {
    try {
      const today = new Date();
      const summaryTime = safeDateParse(today);
      summaryTime.setHours(20, 0, 0, 0);

      if (summaryTime < today) {
        summaryTime.setDate(summaryTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: 999999,
          title: "ðŸ“Š Resumo do Dia",
          body: "Veja seu progresso e doses pendentes",
          largeBody: "Confira como foi seu dia com os medicamentos e veja se hÃ¡ doses pendentes.",
          summaryText: "HoraMed",
          schedule: { at: summaryTime, repeats: true, every: "day" as ScheduleEvery },
          channelId: CHANNEL_ID,
          actionTypeId: "DAILY_SUMMARY",
          extra: { type: "daily_summary" },
          smallIcon: "ic_stat_chart",
          iconColor: "#6366F1",
          sound: "default",
          autoCancel: true,
        }]
      });

    } catch (error) {
      console.error("Error scheduling daily summary:", error);
    }
  };

  const updateQuietHours = (newQuietHours: QuietHours) => {
    setQuietHours(newQuietHours);
    localStorage.setItem('quiet_hours', JSON.stringify(newQuietHours));
    scheduleNext48Hours();
  };

  useEffect(() => {
    const initializeNotifications = async () => {
      // Only initialize scheduling for authenticated users
      if (!user) {
        return;
      }

      // Setup channels first (for Android)
      await setupNotificationChannels();

      // Initialize push notifications (this will request permissions)
      await initializePushNotifications();

      // Sync any offline actions
      await syncOfflineActions();

      // Schedule all notifications for the next 48 hours IMMEDIATELY
      await scheduleNext48Hours();
    };

    void initializeNotifications();

    const handleReschedule = () => {
      void scheduleNext48Hours();
    };
    window.addEventListener("horamed-reschedule-notifications", handleReschedule);

    // Reschedule every 30 minutes
    const scheduleInterval = setInterval(() => {
      void scheduleNext48Hours();
    }, 30 * 60 * 1000);

    // Sync offline actions every 2 minutes
    const syncInterval = setInterval(() => {
      void syncOfflineActions();
    }, 2 * 60 * 1000);

    return () => {
      clearInterval(scheduleInterval);
      clearInterval(syncInterval);
      clearScheduledWebNotifications();
      window.removeEventListener("horamed-reschedule-notifications", handleReschedule);
      const handles = listenerHandlesRef.current;
      listenerHandlesRef.current = [];
      handles.forEach((handle) => {
        void handle.remove();
      });
    };
  }, [clearScheduledWebNotifications, scheduleNext48Hours, syncOfflineActions, user]);

  return {
    checkPermissions,
    scheduleNext48Hours,
    scheduleDailySummary,
    quietHours,
    updateQuietHours,
    syncOfflineActions,
    requestNotificationPermission,
  };
};

