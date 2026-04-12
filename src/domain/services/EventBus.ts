/**
 * EventBus - Sistema de mensageria local para arquitetura orientada a eventos.
 * Evita o acoplamento excessivo entre as camadas de Repository, UI, e Notificações Locais.
 */

type EventCallback = (payload?: any) => void;

class EventBus {
  private listeners: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // Função para remover o listener
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, payload?: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => {
      try {
        cb(payload);
      } catch (error) {
        console.error(`[EventBus] Erro ao emitir evento ${event}:`, error);
      }
    });
  }
}

// Exporta como singleton
export const eventBus = new EventBus();

// Dicionário de eventos do sistema
export const AppEvents = {
  DOSE_TAKEN: 'DOSE_TAKEN',
  MEDICATION_CREATED: 'MEDICATION_CREATED',
  DOSE_SNOOZED: 'DOSE_SNOOZED',
  DOSE_SKIPPED: 'DOSE_SKIPPED',
  DOSE_MISSED: 'DOSE_MISSED',
  SYNC_REQUESTED: 'SYNC_REQUESTED'
} as const;
