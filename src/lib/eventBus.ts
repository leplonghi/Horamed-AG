type EventHandler = (data?: any) => void;

class EventBus {
    private listeners: Map<string, EventHandler[]> = new Map();

    on(event: string, handler: EventHandler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(handler);
        return () => this.off(event, handler);
    }

    off(event: string, handler: EventHandler) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            this.listeners.set(event, handlers.filter(h => h !== handler));
        }
    }

    emit(event: string, data?: any) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.forEach(h => h(data));
        }
    }
}

export const eventBus = new EventBus();

// Event types
export const EVENTS = {
    MEDICATION_UPDATED: 'medication_updated',
    DOSE_TAKEN: 'dose_taken',
    SUBSCRIPTION_CHANGED: 'subscription_changed'
} as const;
