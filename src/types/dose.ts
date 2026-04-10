/**
 * Dose Type Definitions
 * Strict typing for medication dose instances
 */

import { Timestamp } from 'firebase/firestore';
import { safeDateParse, safeGetTime, isTimestampLike } from "@/lib/safeDateUtils";

/**
 * Status possíveis de uma dose
 */
export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped' | 'snoozed' | 'scheduled';

/**
 * Informações do medicamento associado à dose
 */
export interface DoseItem {
    name: string;
    dose_text: string | null;
    type?: 'medication' | 'supplement' | 'vitamin' | 'other';
    icon?: string;
}

/**
 * Instância de dose individual
 * Suporta tanto Firestore (camelCase) quanto Supabase (snake_case)
 */
export interface Dose {
    id: string;
    item_id: string;
    profile_id: string;

    // Data/hora da dose - aceita múltiplos formatos
    due_at?: string | Date | Timestamp;
    dueAt?: string | Date | Timestamp;

    status: DoseStatus;

    // Timestamps de ação
    taken_at?: string | Date | Timestamp | null;
    takenAt?: string | Date | Timestamp | null;

    created_at?: string | Date | Timestamp;
    createdAt?: string | Date | Timestamp;

    // Informações do item
    items: DoseItem;

    // Metadados opcionais
    notes?: string;
    reminder_sent?: boolean;
    snoozed_until?: string | Date | Timestamp | null;
    // Flattened/Legacy properties (optional)
    itemName?: string;
    doseText?: string;
    itemId?: string; // Legacy support
}


/**
 * Dose com data garantidamente parseada
 * Use após processar com safeParseDoseDate()
 */
export interface ParsedDose extends Omit<Dose, 'due_at' | 'dueAt'> {
    dueDate: Date;
    isValid: boolean;
}

/**
 * Estatísticas de doses por período
 */
export interface DoseStats {
    total: number;
    taken: number;
    missed: number;
    pending: number;
    adherenceRate: number; // 0-100
}

/**
 * Agrupamento de doses por dia
 */
export interface DosesByDay {
    [dateKey: string]: {
        doses: Dose[];
        stats: DoseStats;
    };
}

/**
 * Próxima dose pendente com informações adicionais
 */
export interface NextDose {
    dose: Dose;
    dueDate: Date;
    minutesUntil: number;
    isOverdue: boolean;
    isNow: boolean;
}

/**
 * Helper: Parse seguro de data de dose
 * Retorna Date válido ou null
 */
export function safeParseDoseDate(dose: Dose): Date | null {
    try {
        // Tenta due_at primeiro (Supabase)
        const dateValue = dose.due_at || dose.dueAt;

        if (!dateValue) return null;

        // Se já é Date
        if (dateValue instanceof Date) {
            return isNaN(dateValue.getTime()) ? null : dateValue;
        }

        // Se é Firestore Timestamp
        if (isTimestampLike(dateValue)) {
            return dateValue.toDate();
        }

        // Se é string ou número
        // Timestamp is handled by the type guard above
        const parsed = safeDateParse(dateValue, new Date(NaN));
        return isNaN(parsed.getTime()) ? null : parsed;

    } catch {
        return null;
    }
}

/**
 * Helper: Converte Dose para ParsedDose
 */
export function parseDose(dose: Dose): ParsedDose | null {
    const dueDate = safeParseDoseDate(dose);

    if (!dueDate) {
        return null;
    }

    const { due_at, dueAt, ...rest } = dose;

    return {
        ...rest,
        dueDate,
        isValid: true,
    };
}

/**
 * Helper: Calcula estatísticas de um array de doses
 */
export function calculateDoseStats(doses: Dose[]): DoseStats {
    const total = doses.length;
    const taken = doses.filter(d => d.status === 'taken').length;
    const missed = doses.filter(d => d.status === 'missed').length;
    const pending = doses.filter(d => d.status === 'pending').length;

    const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 0;

    return {
        total,
        taken,
        missed,
        pending,
        adherenceRate,
    };
}

/**
 * Type guard: Verifica se é uma Dose válida
 */
export function isDose(value: unknown): value is Dose {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.id === 'string' &&
        typeof v.item_id === 'string' &&
        typeof v.status === 'string' &&
        v.items !== null &&
        v.items !== undefined &&
        typeof (v.items as Record<string, unknown>)?.name === 'string'
    );
}
