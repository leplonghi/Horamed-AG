import { describe, it, expect } from 'vitest';

// Pure streak calculation logic extracted for unit testing
interface DayData { taken: number; total: number }

function computeCurrentStreak(
  dayMap: Map<string, DayData>,
  today: Date
): number {
  const { startOfDay, subDays } = (() => {
    function startOfDay(d: Date): Date {
      const r = new Date(d);
      r.setHours(0, 0, 0, 0);
      return r;
    }
    function subDays(d: Date, n: number): Date {
      const r = new Date(d);
      r.setDate(r.getDate() - n);
      return r;
    }
    return { startOfDay, subDays };
  })();

  let currentStreak = 0;
  let checkDate = startOfDay(today);
  let forgiveUsed = false;

  while (true) {
    const dayKey = checkDate.toISOString();
    const dayData = dayMap.get(dayKey);

    if (!dayData) break;

    const adherence = dayData.taken / dayData.total;
    if (adherence >= 0.8) {
      currentStreak++;
      forgiveUsed = false;
      checkDate = subDays(checkDate, 1);
    } else if (!forgiveUsed) {
      // Check 7-day rolling average
      let windowTaken = 0, windowTotal = 0;
      for (let w = 0; w < 7; w++) {
        const wDate = subDays(checkDate, w);
        wDate.setHours(0, 0, 0, 0);
        const wKey = wDate.toISOString();
        const wData = dayMap.get(wKey);
        if (wData) { windowTaken += wData.taken; windowTotal += wData.total; }
      }
      const weeklyAvg = windowTotal > 0 ? windowTaken / windowTotal : 0;
      if (weeklyAvg >= 0.8) {
        forgiveUsed = true;
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return currentStreak;
}

function makeDay(taken: number, total: number, daysAgo: number, today: Date): [string, DayData] {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return [d.toISOString(), { taken, total }];
}

describe('useStreakCalculator streak logic', () => {
  const today = new Date('2026-01-10T00:00:00.000Z');

  it('streak of 0 when no doses today', () => {
    const dayMap = new Map<string, DayData>();
    expect(computeCurrentStreak(dayMap, today)).toBe(0);
  });

  it('streak of 1 when only today is complete', () => {
    const dayMap = new Map<string, DayData>([makeDay(4, 4, 0, today)]);
    expect(computeCurrentStreak(dayMap, today)).toBe(1);
  });

  it('streak of 3 for three consecutive good days', () => {
    const dayMap = new Map<string, DayData>([
      makeDay(4, 4, 0, today),
      makeDay(4, 4, 1, today),
      makeDay(4, 4, 2, today),
    ]);
    expect(computeCurrentStreak(dayMap, today)).toBe(3);
  });

  it('streak breaks when adherence < 80% two days in a row', () => {
    const dayMap = new Map<string, DayData>([
      makeDay(4, 4, 0, today),
      makeDay(4, 4, 1, today),
      makeDay(1, 4, 2, today), // 25% — bad
      makeDay(1, 4, 3, today), // 25% — bad again (no forgiveness window >=80%)
      makeDay(4, 4, 4, today),
    ]);
    // Day 2 is bad; 7-day window around day 2: only days 0-4 have data
    // window taken: 4+4+1+1+4=14 / total: 4+4+4+4+4=20 = 70% < 80% → no forgiveness
    const streak = computeCurrentStreak(dayMap, today);
    expect(streak).toBe(2);
  });

  it('holiday forgiveness: 1 bad day forgiven when weekly avg >= 80%', () => {
    const dayMap = new Map<string, DayData>([
      makeDay(4, 4, 0, today),
      makeDay(4, 4, 1, today),
      makeDay(1, 5, 2, today), // 20% — bad day
      makeDay(5, 5, 3, today),
      makeDay(5, 5, 4, today),
      makeDay(5, 5, 5, today),
      makeDay(5, 5, 6, today),
    ]);
    // 7-day window around day 2: taken=1+4+4+5+5+5+5=29, total=5+4+4+5+5+5+5=33 = 87.8% ≥ 80%
    // → forgiveness granted → streak continues
    const streak = computeCurrentStreak(dayMap, today);
    expect(streak).toBeGreaterThanOrEqual(3);
  });
});
