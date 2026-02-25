import { describe, it, expect } from 'vitest';
import { safeDateParse, safeGetTime } from './safeDateUtils';

describe('safeDateUtils', () => {
    it('should parse valid dates correctly', () => {
        const d = new Date('2024-01-01');
        expect(safeDateParse(d.toISOString())).toBeInstanceOf(Date);
    });

    it('should return number for valid time', () => {
        const d = new Date('2024-01-01');
        expect(typeof safeGetTime(d)).toBe('number');
    });

    it('should fallback securely on invalid dates', () => {
        expect(safeDateParse(null)).toBeInstanceOf(Date);
        expect(safeDateParse(undefined)).toBeInstanceOf(Date);
        expect(safeDateParse('invalid-date')).toBeInstanceOf(Date);
    });
});
