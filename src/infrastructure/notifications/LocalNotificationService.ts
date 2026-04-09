import { LocalNotifications, ScheduleOptions, PendingResult } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Dose } from '@/types/dose';

export class LocalNotificationService {
  constructor() {
    this.init();
  }

  private async init() {
    if (Capacitor.getPlatform() === 'web') return; // Notificações locais não rodam bem em PWA/web sem service workers complexos, vamos focar no mobile

    try {
        const { display } = await LocalNotifications.checkPermissions();
        if (display !== 'granted') {
            await LocalNotifications.requestPermissions();
        }
    } catch (e) {
        console.warn("[LocalNotifications] Falha ao checar permissões nativas:", e);
    }
  }

  /**
   * Converte ID alfanumérico para ID numérico (Capacitor exige number)
   */
  private generateNotificationId(stringId: string): number {
    let hash = 0;
    for (let i = 0; i < stringId.length; i++) {
        hash = ((hash << 5) - hash) + stringId.charCodeAt(i);
        hash |= 0; 
    }
    return Math.abs(hash);
  }

  /**
   * Agenda notificação de um remédio. Cancelando se já existir na mesma ID para não duplicar.
   */
  async scheduleDose(dose: Dose) {
    if (Capacitor.getPlatform() === 'web') return;

    try {
        const dueAt = new Date(dose.due_at || dose.dueAt || new Date());
        // Não agenda para o passado
        if (dueAt.getTime() < Date.now()) return;

        const notifId = this.generateNotificationId(dose.id);
        const itemName = dose.itemName || dose.items?.name || "Medicamento";
        
        // Remove agendamento antigo se existir
        await this.cancelDose(dose.id);

        const options: ScheduleOptions = {
            notifications: [
                {
                    id: notifId,
                    title: `HoraMed: Hora do ${itemName}`,
                    body: `Está na hora da sua dose de ${itemName}.`,
                    schedule: { at: dueAt },
                    sound: "beep.wav", 
                    actionTypeId: "",
                    extra: null
                }
            ]
        };

        await LocalNotifications.schedule(options);
        console.log(`[LocalNotifications] Agendado ${itemName} para ${dueAt.toISOString()}`);
    } catch (error) {
        console.error("[LocalNotifications] Erro ao agendar dose:", error);
    }
  }

  async cancelDose(doseId: string) {
    if (Capacitor.getPlatform() === 'web') return;

    try {
        const notifId = this.generateNotificationId(doseId);
        
        // Checa pendentes primeiro para evitar erros no native (opcional, mas recomendado)
        const pending: PendingResult = await LocalNotifications.getPending();
        const hasPending = pending.notifications.some(n => n.id === notifId);
        
        if (hasPending) {
           await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
        }
    } catch (error) {
        console.error("[LocalNotifications] Erro ao cancelar notificação:", error);
    }
  }
}

export const localNotificationService = new LocalNotificationService();
