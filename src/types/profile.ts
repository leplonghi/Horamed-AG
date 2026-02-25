/**
 * Profile Type Definitions
 * Strict typing for user profiles
 */

import { Timestamp } from 'firebase/firestore';
import { safeDateParse, safeGetTime, isTimestampLike } from "@/lib/safeDateUtils";

/**
 * Tipo de perfil
 */
export type ProfileType = 'self' | 'dependent' | 'caregiver';

/**
 * Gênero
 */
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

/**
 * Perfil de usuário/dependente
 */
export interface Profile {
    id: string;
    user_id: string;

    // Informações básicas
    name: string;
    type: ProfileType;
    gender?: Gender;
    birth_date?: string | Date | Timestamp;
    birthDate?: string | Date | Timestamp;

    // Foto
    photo_url?: string | null;
    photoUrl?: string | null;

    // Configurações
    is_active?: boolean;
    isActive?: boolean;

    // Timestamps
    created_at?: string | Date | Timestamp;
    createdAt?: string | Date | Timestamp;
    updated_at?: string | Date | Timestamp;
    updatedAt?: string | Date | Timestamp;

    // Metadados opcionais
    weight?: number; // kg
    height?: number; // cm
    allergies?: string[];
    medical_conditions?: string[];
    emergency_contact?: {
        name: string;
        phone: string;
        relationship: string;
    };
}

/**
 * Helper: Parse seguro de data de nascimento
 */
export function safeParseProfileBirthDate(profile: Profile): Date | null {
    try {
        const dateValue = profile.birth_date || profile.birthDate;

        if (!dateValue) return null;

        if (dateValue instanceof Date) {
            return isNaN(dateValue.getTime()) ? null : dateValue;
        }

        if (isTimestampLike(dateValue)) {
            return dateValue.toDate();
        }

        const parsed = safeDateParse(dateValue as string | number);
        return isNaN(parsed.getTime()) ? null : parsed;

    } catch {
        return null;
    }
}

/**
 * Helper: Calcula idade a partir do perfil
 */
export function calculateAge(profile: Profile): number | null {
    const birthDate = safeParseProfileBirthDate(profile);

    if (!birthDate) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

/**
 * Type guard: Verifica se é um Profile válido
 */
export function isProfile(value: unknown): value is Profile {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.id === 'string' &&
        typeof v.user_id === 'string' &&
        typeof v.name === 'string'
    );
}
