import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { Profile, safeParseProfileBirthDate, calculateAge } from '../profile';

describe('safeParseProfileBirthDate', () => {
    it('returns null if profile has no birth date', () => {
        const profile = { birth_date: undefined, birthDate: undefined } as unknown as Profile;
        expect(safeParseProfileBirthDate(profile)).toBeNull();
    });

    it('parses a standard JS Date', () => {
        const date = new Date('1990-01-01T00:00:00Z');
        const profile = { birth_date: date } as unknown as Profile;
        expect(safeParseProfileBirthDate(profile)?.toISOString()).toBe(date.toISOString());
    });

    it('parses an ISO string date', () => {
        const profile = { birthDate: '1990-01-01T00:00:00Z' } as unknown as Profile;
        expect(safeParseProfileBirthDate(profile)?.toISOString()).toBe('1990-01-01T00:00:00.000Z');
    });

    it('parses a Firestore Timestamp', () => {
        const timestamp = {
            sections: 0,
            toDate: () => new Date('1990-01-01T00:00:00Z'),
            toMillis: () => 0
        } as unknown as Timestamp;
        
        const profile = { birth_date: timestamp } as unknown as Profile;
        expect(safeParseProfileBirthDate(profile)?.toISOString()).toBe('1990-01-01T00:00:00.000Z');
    });
});

describe('calculateAge', () => {
    it('returns null for missing birth date', () => {
        const profile = {} as Profile;
        expect(calculateAge(profile)).toBeNull();
    });

    it('calculates correct age before birthday in current year', () => {
        // Create an age roughly 30 years ago, pushing month ahead of current to ensure age is 29
        const today = new Date();
        const birthDate = new Date(today.getFullYear() - 30, today.getMonth() + 1, today.getDate());
        
        const profile = { birth_date: birthDate } as unknown as Profile;
        expect(calculateAge(profile)).toBe(29);
    });

    it('calculates correct age after birthday in current year', () => {
        // Create an age exactly 30 years ago, pushing month before current
        const today = new Date();
        const birthDate = new Date(today.getFullYear() - 30, today.getMonth() - 1, today.getDate());
        
        const profile = { birth_date: birthDate } as unknown as Profile;
        expect(calculateAge(profile)).toBe(30);
    });
});
