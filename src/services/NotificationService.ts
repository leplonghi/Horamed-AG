/**
 * NotificationService - Serviço Unificado de Notificações HoraMed
 * 
 * Arquitetura:
 * 1. Alarme Local (PRIMÁRIO) - Capacitor LocalNotifications
 *    - Funciona offline, app fechado, tela bloqueada
 *    - Canal dedicado horamed_alarm com IMPORTANCE_HIGH
 * 
 * 2. Push FCM (BACKUP) - Firebase Cloud Messaging
 *    - Complementar, não substituto
 *    - Sync via notification_id único
 * 
 * 3. Logs em notification_logs para telemetria
 */

import { Capacitor } from "@capacitor/core";
import { LocalNotifications, ScheduleOptions } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";

// Constants
export const ALARM_CHANNEL_ID = "horamed_alarm";
export const ALARM_CHANNEL_NAME = "Alarmes de Medicamentos";

export interface DoseNotification {
  doseId: string;
  itemId: string;
  itemName: string;
  doseText?: string;
  scheduledAt: Date;
}

export interface NotificationResult {
  success: boolean;
  method: "local" | "push" | "web" | "none";
  notificationId: number;
  error?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private scheduledAlarms = new Set<string>();
  
  private constructor() {}
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  /**
   * Initialize notification service
   * Creates channels and requests permissions
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    const isNative = Capacitor.isNativePlatform();
    const isAndroid = Capacitor.getPlatform() === "android";
    
    try {
      if (isNative) {
        // Create Android notification channel
        if (isAndroid) {
          await LocalNotifications.createChannel({
            id: ALARM_CHANNEL_ID,
            name: ALARM_CHANNEL_NAME,
            description: "Alarmes importantes para lembrar de tomar medicamentos",
            importance: 5, // IMPORTANCE_HIGH
            visibility: 1, // PUBLIC
            sound: "alarm.wav",
            vibration: true,
            lights: true,
            lightColor: "#10B981",
          });
          console.log("[NotificationService] ✓ Canal Android criado");
        }
        
        // Setup listeners for notifications
        await this.setupListeners();
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("[NotificationService] Erro na inicialização:", error);
      return false;
    }
  }
  
  /**
   * Request all necessary permissions
   */
  async requestPermissions(): Promise<boolean> {
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      try {
        // Local notifications
        const localResult = await LocalNotifications.requestPermissions();
        console.log("[NotificationService] Permissões locais:", localResult.display);
        
        // Push notifications (non-blocking)
        try {
          const pushResult = await PushNotifications.requestPermissions();
          if (pushResult.receive === "granted") {
            await PushNotifications.register();
            console.log("[NotificationService] ✓ Push registrado");
          }
        } catch (e) {
          console.log("[NotificationService] Push não disponível");
        }
        
        return localResult.display === "granted";
      } catch (error) {
        console.error("[NotificationService] Erro ao pedir permissões:", error);
        return false;
      }
    } else {
      // Web notifications
      if ("Notification" in window) {
        const result = await Notification.requestPermission();
        return result === "granted";
      }
      return false;
    }
  }
  
  /**
   * Check current permission status
   */
  async checkPermissions(): Promise<"granted" | "denied" | "prompt"> {
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      const result = await LocalNotifications.checkPermissions();
      return result.display as "granted" | "denied" | "prompt";
    } else if ("Notification" in window) {
      return Notification.permission as "granted" | "denied" | "prompt";
    }
    return "denied";
  }
  
  /**
   * Generate unique notification ID from dose ID
   */
  generateNotificationId(doseId: string): number {
    // Use hash of dose ID to generate consistent numeric ID
    let hash = 0;
    for (let i = 0; i < doseId.length; i++) {
      const char = doseId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash % 100000000); // Keep it positive and reasonable
  }
  
  /**
   * Schedule alarm for a dose (PRIMARY method)
   */
  async scheduleDoseAlarm(dose: DoseNotification): Promise<NotificationResult> {
    const notificationId = this.generateNotificationId(dose.doseId);
    const alarmKey = `${dose.doseId}-${dose.scheduledAt.getTime()}`;
    
    // Prevent duplicate scheduling
    if (this.scheduledAlarms.has(alarmKey)) {
      console.log("[NotificationService] Alarme já agendado:", alarmKey);
      return { success: true, method: "local", notificationId };
    }
    
    const title = "⏰ Hora do remédio!";
    const body = dose.doseText 
      ? `${dose.itemName} - ${dose.doseText}`
      : dose.itemName;
    
    const isNative = Capacitor.isNativePlatform();
    const isAndroid = Capacitor.getPlatform() === "android";
    
    // 1. Try LOCAL ALARM first (PRIMARY)
    if (isNative) {
      try {
        const scheduleOptions: ScheduleOptions = {
          notifications: [{
            id: notificationId,
            title,
            body,
            schedule: {
              at: dose.scheduledAt,
              allowWhileIdle: true, // CRITICAL: Works in Doze mode
            },
            channelId: isAndroid ? ALARM_CHANNEL_ID : undefined,
            smallIcon: isAndroid ? "ic_stat_icon" : undefined,
            largeIcon: isAndroid ? "ic_launcher" : undefined,
            sound: "alarm.wav",
            extra: {
              doseId: dose.doseId,
              itemId: dose.itemId,
              itemName: dose.itemName,
              scheduledAt: dose.scheduledAt.toISOString(),
              notificationType: "dose_alarm",
            },
            autoCancel: false,
          }],
        };
        
        await LocalNotifications.schedule(scheduleOptions);
        this.scheduledAlarms.add(alarmKey);
        
        // Log to database
        await this.logNotification({
          doseId: dose.doseId,
          type: "local_alarm",
          status: "scheduled",
          title,
          body,
          scheduledAt: dose.scheduledAt,
          notificationId,
        });
        
        console.log("[NotificationService] ✓ Alarme local agendado:", {
          id: notificationId,
          time: dose.scheduledAt,
        });
        
        // 2. Also schedule PUSH as backup (non-blocking)
        this.schedulePushBackup(dose, notificationId).catch(console.error);
        
        return { success: true, method: "local", notificationId };
      } catch (error) {
        console.error("[NotificationService] Erro no alarme local:", error);
        
        // Fallback to push only
        const pushResult = await this.schedulePushBackup(dose, notificationId);
        if (pushResult) {
          return { success: true, method: "push", notificationId };
        }
        
        return { 
          success: false, 
          method: "none", 
          notificationId,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        };
      }
    }
    
    // Web fallback
    if ("Notification" in window && Notification.permission === "granted") {
      const delay = dose.scheduledAt.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          new Notification(title, {
            body,
            icon: "/favicon.png",
            tag: dose.doseId,
            requireInteraction: true,
          });
        }, delay);
        
        await this.logNotification({
          doseId: dose.doseId,
          type: "web",
          status: "scheduled",
          title,
          body,
          scheduledAt: dose.scheduledAt,
          notificationId,
        });
        
        return { success: true, method: "web", notificationId };
      }
    }
    
    return { success: false, method: "none", notificationId, error: "Nenhum método disponível" };
  }
  
  /**
   * Schedule push notification as backup (SECONDARY)
   */
  private async schedulePushBackup(dose: DoseNotification, notificationId: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // Check if push is enabled
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("push_enabled, push_token")
        .eq("user_id", user.id)
        .single();
      
      if (!prefs?.push_enabled || !prefs.push_token) {
        return false;
      }
      
      // Schedule via edge function
      const { error } = await supabase.functions.invoke("send-dose-notification", {
        body: {
          doseId: dose.doseId,
          userId: user.id,
          title: "⏰ Hora do remédio!",
          body: dose.doseText ? `${dose.itemName} - ${dose.doseText}` : dose.itemName,
          scheduledAt: dose.scheduledAt.toISOString(),
        },
      });
      
      if (error) {
        console.error("[NotificationService] Erro no push backup:", error);
        return false;
      }
      
      console.log("[NotificationService] ✓ Push backup agendado");
      return true;
    } catch (error) {
      console.error("[NotificationService] Erro no push backup:", error);
      return false;
    }
  }
  
  /**
   * Schedule all pending doses for the next 24 hours
   */
  async scheduleAllPendingDoses(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const { data: doses, error } = await supabase
        .from("dose_instances")
        .select(`
          id,
          due_at,
          status,
          item_id,
          items (
            name,
            dose_text
          )
        `)
        .eq("status", "scheduled")
        .gte("due_at", now.toISOString())
        .lte("due_at", next24h.toISOString())
        .order("due_at");
      
      if (error || !doses) {
        console.error("[NotificationService] Erro ao buscar doses:", error);
        return 0;
      }
      
      let scheduled = 0;
      for (const dose of doses) {
        const item = dose.items as { name: string; dose_text: string | null };
        const result = await this.scheduleDoseAlarm({
          doseId: dose.id,
          itemId: dose.item_id,
          itemName: item.name,
          doseText: item.dose_text || undefined,
          scheduledAt: new Date(dose.due_at),
        });
        
        if (result.success) scheduled++;
      }
      
      console.log(`[NotificationService] Agendados ${scheduled}/${doses.length} doses`);
      return scheduled;
    } catch (error) {
      console.error("[NotificationService] Erro ao agendar doses:", error);
      return 0;
    }
  }
  
  /**
   * Cancel a scheduled alarm
   */
  async cancelAlarm(doseId: string): Promise<void> {
    const notificationId = this.generateNotificationId(doseId);
    
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
        console.log("[NotificationService] Alarme cancelado:", notificationId);
      } catch (error) {
        console.error("[NotificationService] Erro ao cancelar:", error);
      }
    }
    
    // Remove from scheduled set
    for (const key of this.scheduledAlarms) {
      if (key.startsWith(doseId)) {
        this.scheduledAlarms.delete(key);
      }
    }
  }
  
  /**
   * Send test alarm (for onboarding)
   */
  async sendTestAlarm(delaySeconds: number = 120): Promise<NotificationResult> {
    const testId = `test-${Date.now()}`;
    const testTime = new Date(Date.now() + delaySeconds * 1000);
    
    return this.scheduleDoseAlarm({
      doseId: testId,
      itemId: testId,
      itemName: "Teste de Alarme",
      doseText: "Verifique se o alarme tocou!",
      scheduledAt: testTime,
    });
  }
  
  /**
   * Setup notification listeners
   */
  private async setupListeners(): Promise<void> {
    // When notification is received (foreground)
    await LocalNotifications.addListener("localNotificationReceived", (notification) => {
      console.log("[NotificationService] Notificação recebida:", notification);
      
      this.logNotification({
        doseId: notification.extra?.doseId || "unknown",
        type: "local_alarm",
        status: "delivered",
        title: notification.title || "",
        body: notification.body || "",
        scheduledAt: new Date(),
        notificationId: notification.id,
      }).catch(console.error);
      
      // Dispatch event for components to handle
      window.dispatchEvent(new CustomEvent("horamed-alarm", {
        detail: {
          doseId: notification.extra?.doseId,
          itemName: notification.extra?.itemName,
          notificationId: notification.id,
        },
      }));
    });
    
    // When user taps on notification
    await LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
      console.log("[NotificationService] Ação:", action);
      
      const doseId = action.notification.extra?.doseId;
      if (doseId && !doseId.startsWith("test-")) {
        // Navigate to dose action
        window.dispatchEvent(new CustomEvent("horamed-action", {
          detail: {
            doseId,
            actionId: action.actionId,
          },
        }));
      }
    });
    
    // Push notification received
    try {
      await PushNotifications.addListener("pushNotificationReceived", (notification) => {
        console.log("[NotificationService] Push recebido:", notification);
      });
    } catch (e) {
      // Push not available
    }
  }
  
  /**
   * Log notification to database
   */
  private async logNotification(data: {
    doseId: string;
    type: string;
    status: string;
    title: string;
    body: string;
    scheduledAt: Date;
    notificationId: number;
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase.from("notification_logs").insert({
        user_id: user.id,
        dose_id: data.doseId.startsWith("test-") ? null : data.doseId,
        notification_type: data.type,
        title: data.title,
        body: data.body,
        scheduled_at: data.scheduledAt.toISOString(),
        delivery_status: data.status,
        metadata: {
          notificationId: data.notificationId,
          platform: Capacitor.getPlatform(),
        },
      });
    } catch (error) {
      console.error("[NotificationService] Erro ao logar:", error);
    }
  }
  
  /**
   * Get pending notifications
   */
  async getPendingNotifications(): Promise<{ id: number; title?: string; body?: string; scheduledAt: Date }[]> {
    if (!Capacitor.isNativePlatform()) return [];
    
    try {
      const { notifications } = await LocalNotifications.getPending();
      return notifications.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        scheduledAt: n.schedule?.at ? new Date(n.schedule.at) : new Date(),
      }));
    } catch (error) {
      console.error("[NotificationService] Erro ao buscar pendentes:", error);
      return [];
    }
  }
}

// Export singleton
export const notificationService = NotificationService.getInstance();
export default notificationService;
