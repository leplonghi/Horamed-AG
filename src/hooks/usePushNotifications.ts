import { useEffect, useState } from "react";
import { PushNotifications, ActionPerformed } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, addMinutes, startOfDay, endOfDay, addHours, isAfter, isBefore } from "date-fns";

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

export const usePushNotifications = () => {
  const navigate = useNavigate();
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: false,
    startTime: "22:00",
    endTime: "06:00"
  });
  
  useEffect(() => {
    initializePushNotifications();
    scheduleNext48Hours();
    syncOfflineActions();
    
    // Reschedule every 30 minutes
    const scheduleInterval = setInterval(() => {
      scheduleNext48Hours();
    }, 30 * 60 * 1000);
    
    // Sync offline actions every minute
    const syncInterval = setInterval(() => {
      syncOfflineActions();
    }, 60 * 1000);
    
    return () => {
      clearInterval(scheduleInterval);
      clearInterval(syncInterval);
    };
  }, []);

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

  const initializePushNotifications = async () => {
    try {
      // Request Push Notifications permission
      const pushPermStatus = await PushNotifications.requestPermissions();
      
      if (pushPermStatus.receive === "granted") {
        await PushNotifications.register();
        toast.success("✓ Notificações ativadas!", { duration: 2000 });
      } else {
        toast.error("Permissão negada. Ative em Configurações.", { duration: 3000 });
      }
      
      // Request Local Notifications permission
      const localPermStatus = await LocalNotifications.requestPermissions();
      if (localPermStatus.display !== "granted") {
        console.warn("Local notifications permission not granted");
      }

      // Handle registration success
      await PushNotifications.addListener("registration", (token) => {
        console.log("Push registration success, token: " + token.value);
        savePushToken(token.value);
      });

      // Handle registration errors
      await PushNotifications.addListener("registrationError", (error) => {
        console.error("Push registration error: ", error);
        toast.error("Erro ao registrar notificações push");
      });

      // Handle push notifications received (foreground)
      await PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          console.log("Push received (foreground): ", notification);
          // Don't show toast if in quiet hours
          if (!isInQuietHours(new Date())) {
            toast.info(notification.title || "💊 Lembrete de Medicamento", {
              description: notification.body,
              duration: 5000,
            });
          }
        }
      );

      // Handle notification action (when user taps notification)
      await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        async (action: ActionPerformed) => {
          console.log("Push action performed: ", action);
          handleNotificationAction(action);
        }
      );
      
      // Handle local notification actions
      await LocalNotifications.addListener(
        "localNotificationActionPerformed",
        async (action) => {
          console.log("Local notification action: ", action);
          handleNotificationAction(action as any);
        }
      );
    } catch (error) {
      console.error("Error initializing push notifications:", error);
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
      // Default - navigate to today
      navigate("/hoje");
    }
  };

  const handleDoseAction = async (doseId: string, action: 'taken' | 'snooze' | 'skip') => {
    try {
      // Check if online
      const isOnline = navigator.onLine;
      
      if (!isOnline) {
        // Save to offline queue
        saveOfflineAction(doseId, action);
        toast.info(`⏸️ Ação salva (offline). Sincronizará quando conectar.`, { duration: 3000 });
        return;
      }

      const { data, error } = await supabase.functions.invoke('handle-dose-action', {
        body: { doseId, action }
      });

      if (error) throw error;

      if (action === 'taken') {
        toast.success(data.message || '✅ Dose marcada!', {
          description: data.streak > 3 ? `🔥 ${data.streak} dias seguidos!` : undefined,
          duration: 3000
        });
      } else if (action === 'snooze') {
        toast.info(data.message || '⏰ Lembrete adiado 15 minutos', { duration: 2000 });
        // Reschedule notification
        await scheduleSnoozeNotification(doseId, 15);
      } else if (action === 'skip') {
        toast.info('→ Dose pulada', { duration: 2000 });
      }
    } catch (error) {
      console.error('Error handling dose action:', error);
      // Save to offline queue on error
      saveOfflineAction(doseId, action);
      toast.error('Erro. Salvamos sua ação e tentaremos novamente.', { duration: 3000 });
    }
  };

  const saveOfflineAction = (doseId: string, action: 'taken' | 'snooze' | 'skip') => {
    const actions = getOfflineActions();
    const newAction: OfflineAction = {
      id: Date.now().toString(),
      doseId,
      action,
      timestamp: new Date().toISOString(),
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

    console.log(`Syncing ${unsyncedActions.length} offline actions...`);

    for (const action of unsyncedActions) {
      try {
        const { error } = await supabase.functions.invoke('handle-dose-action', {
          body: { 
            doseId: action.doseId, 
            action: action.action,
            timestamp: action.timestamp // Send original timestamp
          }
        });

        if (!error) {
          // Mark as synced
          action.synced = true;
        }
      } catch (error) {
        console.error('Error syncing action:', error);
      }
    }

    // Update localStorage
    localStorage.setItem('offline_dose_actions', JSON.stringify(actions));

    // Clean up old synced actions (older than 7 days)
    const cleanedActions = actions.filter(a => {
      if (a.synced) {
        const actionDate = new Date(a.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return actionDate > weekAgo;
      }
      return true;
    });
    localStorage.setItem('offline_dose_actions', JSON.stringify(cleanedActions));
  };

  const scheduleNext48Hours = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get doses for next 48 hours
      const now = new Date();
      const end48h = addHours(now, 48);

      const { data: doses, error } = await supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          status,
          items (
            id,
            name,
            dose_text,
            user_id
          )
        `)
        .eq("items.user_id", user.id)
        .eq("status", "scheduled")
        .gte("due_at", now.toISOString())
        .lte("due_at", end48h.toISOString())
        .order("due_at", { ascending: true });

      if (error) throw error;
      if (!doses || doses.length === 0) return;

      // Cancel all pending local notifications first
      const pending = await LocalNotifications.getPending();
      if (pending.notifications && pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }

      // Schedule new notifications
      const notifications = doses.map((dose, index) => {
        const dueDate = new Date(dose.due_at);
        
        // Skip if in quiet hours
        if (isInQuietHours(dueDate)) {
          return null;
        }

        return {
          id: index + 1,
          title: `💊 ${dose.items.name}`,
          body: dose.items.dose_text || "Hora de tomar seu medicamento",
          schedule: { at: dueDate },
          actionTypeId: "DOSE_REMINDER",
          extra: {
            doseId: dose.id,
            itemName: dose.items.name,
          },
          attachments: undefined,
          sound: "default",
        };
      }).filter(Boolean);

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications: notifications as any[] });
        console.log(`✓ Scheduled ${notifications.length} notifications for next 48h`);
      }
    } catch (error) {
      console.error("Error scheduling notifications:", error);
    }
  };

  const scheduleSnoozeNotification = async (doseId: string, minutes: number) => {
    try {
      const { data: dose } = await supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          items (
            name,
            dose_text
          )
        `)
        .eq("id", doseId)
        .single();

      if (!dose) return;

      const snoozeTime = addMinutes(new Date(), minutes);

      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: `⏰ ${dose.items.name}`,
          body: dose.items.dose_text || "Lembrete adiado",
          schedule: { at: snoozeTime },
          actionTypeId: "DOSE_REMINDER",
          extra: {
            doseId: dose.id,
            itemName: dose.items.name,
          },
        }]
      });

      console.log(`✓ Snoozed notification for ${minutes} minutes`);
    } catch (error) {
      console.error("Error scheduling snooze notification:", error);
    }
  };

  const savePushToken = async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          push_token: token,
          push_enabled: true,
        });

      if (error) {
        console.error("Error saving push token:", error);
      }
    } catch (error) {
      console.error("Error in savePushToken:", error);
    }
  };

  const checkPermissions = async () => {
    const permStatus = await PushNotifications.checkPermissions();
    return permStatus.receive === "granted";
  };

  const scheduleDailySummary = async () => {
    try {
      // Schedule daily summary at 8 PM
      const today = new Date();
      const summaryTime = new Date(today);
      summaryTime.setHours(20, 0, 0, 0);
      
      // If time passed, schedule for tomorrow
      if (summaryTime < today) {
        summaryTime.setDate(summaryTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: 999999,
          title: "📊 Resumo do Dia",
          body: "Veja seu resumo de progresso e doses pendentes",
          schedule: { at: summaryTime, repeats: true, every: "day" },
          extra: { type: "daily_summary" },
        }]
      });

      console.log("✓ Daily summary scheduled for 8 PM");
    } catch (error) {
      console.error("Error scheduling daily summary:", error);
    }
  };

  const updateQuietHours = (newQuietHours: QuietHours) => {
    setQuietHours(newQuietHours);
    localStorage.setItem('quiet_hours', JSON.stringify(newQuietHours));
    // Reschedule notifications
    scheduleNext48Hours();
  };

  return {
    checkPermissions,
    scheduleNext48Hours,
    scheduleDailySummary,
    quietHours,
    updateQuietHours,
    syncOfflineActions,
  };
};
