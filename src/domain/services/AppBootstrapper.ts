import { eventBus, AppEvents } from "./EventBus";
import { localNotificationService } from "@/infrastructure/notifications/LocalNotificationService";
import { Dose } from "@/types/dose";
import { validateStripeConfig, checkEnvironmentSecurity } from "@/lib/securityCheck";

export class AppBootstrapper {
  static init() {
    console.log("[AppBootstrapper] Inicializando bindings arquiteturais da FASE 2...");

    // Security & Sanity Checks
    checkEnvironmentSecurity();
    validateStripeConfig();

    // 1. Ao criar medicamento (quando o app gera múltiplas doses localmente), o EventBus avisa:
    eventBus.on(AppEvents.MEDICATION_CREATED, (payload: { doses: Dose[] }) => {
      if (payload && payload.doses) {
        payload.doses.forEach(dose => {
          localNotificationService.scheduleDose(dose);
        });
      }
    });

    // 2. Ao adiar uma dose, ela deve ser reagendada nativamente (pra tocar em X minutos)
    eventBus.on(AppEvents.DOSE_SNOOZED, (payload: { doseId: string, newDateIso: string, itemName: string }) => {
      // Cria uma pseudo dose para enganar a tipagem do agendador e garantir o alarme
      localNotificationService.scheduleDose({
        id: payload.doseId,
        itemName: payload.itemName,
        dueAt: payload.newDateIso
      } as Partial<Dose> as Dose);
    });

    // 3. Ao tomar uma dose antecipadamente (ou cancelá-la), removemos do agendador nativo
    eventBus.on(AppEvents.DOSE_TAKEN, (payload: { doseId: string }) => {
      localNotificationService.cancelDose(payload.doseId);
    });
  }
}
