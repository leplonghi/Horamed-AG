import { describe, it, expect } from 'vitest';

// Pure logic extracted from useMedicationLimits for unit testing
function computeLimits(
  activeCount: number,
  isPremium: boolean
): { maxActive: number; canAddMedication: boolean; remaining: number } {
  if (isPremium) {
    return { maxActive: Infinity, canAddMedication: true, remaining: Infinity };
  }
  const maxActive = 3;
  const remaining = Math.max(0, maxActive - activeCount);
  return { maxActive, canAddMedication: activeCount < maxActive, remaining };
}

describe('useMedicationLimits logic', () => {
  it('free user with 0 medications can add (remaining = 3)', () => {
    const result = computeLimits(0, false);
    expect(result.canAddMedication).toBe(true);
    expect(result.remaining).toBe(3);
    expect(result.maxActive).toBe(3);
  });

  it('free user with 2 medications can still add (remaining = 1)', () => {
    const result = computeLimits(2, false);
    expect(result.canAddMedication).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('free user with 3 medications cannot add (remaining = 0)', () => {
    const result = computeLimits(3, false);
    expect(result.canAddMedication).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('free user with more than 3 medications cannot add (remaining = 0, not negative)', () => {
    const result = computeLimits(5, false);
    expect(result.canAddMedication).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('premium user always can add with unlimited limit', () => {
    const result = computeLimits(100, true);
    expect(result.canAddMedication).toBe(true);
    expect(result.maxActive).toBe(Infinity);
    expect(result.remaining).toBe(Infinity);
  });
});
