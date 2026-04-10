import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { Dose, safeParseDoseDate, calculateDoseStats } from '../dose';

describe('safeParseDoseDate', () => {
    it('returns null if dose has no due date', () => {
        const dose = { due_at: undefined, dueAt: undefined } as unknown as Dose;
        expect(safeParseDoseDate(dose)).toBeNull();
    });

    it('parses a standard JS Date', () => {
        const date = new Date('2026-04-10T12:00:00Z');
        const dose = { due_at: date } as unknown as Dose;
        expect(safeParseDoseDate(dose)?.toISOString()).toBe(date.toISOString());
    });

    it('returns null for an invalid JS Date', () => {
        const date = new Date('invalid_date');
        const dose = { dueAt: date } as unknown as Dose;
        expect(safeParseDoseDate(dose)).toBeNull();
    });

    it('parses an ISO string date', () => {
        const dose = { due_at: '2026-04-10T12:00:00Z' } as unknown as Dose;
        expect(safeParseDoseDate(dose)?.toISOString()).toBe('2026-04-10T12:00:00.000Z');
    });

    it('returns null for an invalid string date', () => {
        const dose = { due_at: 'not-a-date' } as unknown as Dose;
        expect(safeParseDoseDate(dose)).toBeNull();
    });

    it('parses a Firestore Timestamp', () => {
        // Mock Timestamp implementation
        const timestamp = {
            seconds: 1712750400,
            nanoseconds: 0,
            toDate: () => new Date('2024-04-10T12:00:00Z'),
            toMillis: () => 1712750400000
        } as unknown as Timestamp;
        
        const dose = { due_at: timestamp } as unknown as Dose;
        expect(safeParseDoseDate(dose)?.toISOString()).toBe('2024-04-10T12:00:00.000Z');
    });
});

describe('calculateDoseStats', () => {
    it('calculates full statistics correctly', () => {
        const doses: Dose[] = [
            { status: 'taken' },
            { status: 'taken' },
            { status: 'missed' },
            { status: 'pending' },
            { status: 'pending' }
        ] as Dose[];

        const stats = calculateDoseStats(doses);

        expect(stats.total).toBe(5);
        expect(stats.taken).toBe(2);
        expect(stats.missed).toBe(1);
        expect(stats.pending).toBe(2);
        expect(stats.adherenceRate).toBe(40); // 2/5 * 100
    });

    it('handles empty dose array', () => {
        const stats = calculateDoseStats([]);
        expect(stats.total).toBe(0);
        expect(stats.taken).toBe(0);
        expect(stats.missed).toBe(0);
        expect(stats.pending).toBe(0);
        expect(stats.adherenceRate).toBe(0);
    });
});
