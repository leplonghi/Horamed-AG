/**
 * Utility functions for safe date parsing across the application
 * Prevents "Invalid time value" errors
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Represents any value that could be a date.
 * Used across the app for Firestore Timestamps, ISO strings, numbers, and Date objects.
 */
export type DateLike = Date | Timestamp | string | number | null | undefined;

/**
 * Represents an object with a `.toDate()` method (Firestore Timestamp pattern).
 */
interface TimestampLike {
    toDate: () => Date;
}

/**
 * Type guard: checks if a value has a `.toDate()` method (Firestore Timestamp).
 */
export function isTimestampLike(value: unknown): value is TimestampLike {
    return (
        value !== null &&
        value !== undefined &&
        typeof value === 'object' &&
        'toDate' in value &&
        typeof (value as TimestampLike).toDate === 'function'
    );
}

/**
 * Safely parse any date value to a valid Date object
 * @param value - Any value that might represent a date
 * @param fallback - Fallback date if parsing fails (default: current date)
 * @returns Valid Date object
 */
export function safeDateParse(value: DateLike, fallback: Date = new Date()): Date {
    if (value === null || value === undefined) {
        return fallback;
    }

    if (value instanceof Date) {
        return isNaN(value.getTime()) ? fallback : value;
    }

    if (isTimestampLike(value)) {
        try {
            return value.toDate();
        } catch {
            return fallback;
        }
    }

    try {
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? fallback : parsed;
    } catch {
        return fallback;
    }
}

/**
 * Safely get time value from any date
 * @param value - Any value that might represent a date
 * @param fallback - Fallback timestamp (default: current time)
 * @returns Valid timestamp in milliseconds
 */
export function safeGetTime(value: DateLike, fallback: number = Date.now()): number {
    const date = safeDateParse(value, safeDateParse(fallback));
    const time = date.getTime();
    return isNaN(time) ? fallback : time;
}

/**
 * Safely compare two dates
 * @param a - First date value
 * @param b - Second date value
 * @returns Comparison result (negative, 0, positive)
 */
export function safeDateCompare(a: DateLike, b: DateLike): number {
    const timeA = safeGetTime(a);
    const timeB = safeGetTime(b);
    return timeA - timeB;
}
