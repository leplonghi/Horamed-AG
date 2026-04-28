import { useState, useEffect, useCallback, useRef } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { fetchCollection, where, orderBy } from "@/integrations/firebase";
import type { Dose } from "@/types/dose";
import { safeDateParse } from "@/lib/safeDateUtils";

interface AdherenceStats {
  /** Number of doses taken in the window */
  taken: number;
  /** Total scheduled doses in the window */
  total: number;
  /** Adherence rate 0-1 */
  rate: number;
  /** Consecutive-day streak */
  streak: number;
  /** Day labels with individual rates for sparkline */
  history: Array<{ date: string; rate: number }>;
}

const EMPTY: AdherenceStats = {
  taken: 0,
  total: 0,
  rate: 0,
  streak: 0,
  history: [],
};

/**
 * useAdherenceInsights
 *
 * Computes adherence statistics from a single batched Firestore query
 * (no N+1 per-day calls). Returns a 7-day or 30-day window summary plus
 * a day-by-day history suitable for a sparkline chart.
 *
 * @param windowDays  - How many days to look back (default 7)
 */
export function useAdherenceInsights(windowDays = 7) {
  const { user } = useAuth();
  const { activeProfile } = useUserProfiles();

  const [stats, setStats] = useState<AdherenceStats>(EMPTY);
  const [loading, setLoading] = useState(true);

  const compute = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const userId = user.uid;
    const profileId = activeProfile?.id;
    const basePath = profileId
      ? `users/${userId}/profiles/${profileId}`
      : `users/${userId}`;

    const windowEnd = endOfDay(new Date());
    const windowStart = startOfDay(subDays(new Date(), windowDays - 1));

    try {
      const { data } = await fetchCollection<Dose>(`${basePath}/doses`, [
        where("dueAt", ">=", windowStart),
        where("dueAt", "<=", windowEnd),
        orderBy("dueAt", "asc"),
      ]);

      const doses = data ?? [];

      // ── Build per-day buckets ────────────────────────────────────────────
      const buckets: Record<string, { taken: number; total: number }> = {};

      // Pre-fill all days so days with no doses still appear in history
      for (let i = 0; i < windowDays; i++) {
        const key = format(subDays(new Date(), windowDays - 1 - i), "yyyy-MM-dd");
        buckets[key] = { taken: 0, total: 0 };
      }

      for (const dose of doses) {
        const dayKey = dose.dueAt
          ? format(safeDateParse(dose.dueAt as string), "yyyy-MM-dd")
          : null;

        if (!dayKey || !(dayKey in buckets)) continue;

        buckets[dayKey].total += 1;
        if (dose.status === "taken") buckets[dayKey].taken += 1;
      }

      // ── Summarise ───────────────────────────────────────────────────────
      const history = Object.entries(buckets).map(([date, { taken, total }]) => ({
        date,
        rate: total > 0 ? taken / total : 0,
      }));

      const totalTaken = doses.filter((d) => d.status === "taken").length;
      const totalDoses = doses.length;

      // ── Streak (consecutive complete days going back from today) ─────────
      let streak = 0;
      const dayKeys = Object.keys(buckets).sort().reverse();

      for (const key of dayKeys) {
        const { taken, total } = buckets[key];
        if (total === 0) break; // No meds scheduled → don't break streak
        if (taken < total) break;
        streak++;
      }

      setStats({
        taken: totalTaken,
        total: totalDoses,
        rate: totalDoses > 0 ? totalTaken / totalDoses : 0,
        streak,
        history,
      });
    } catch {
      // Non-critical — keep previous stats
    } finally {
      setLoading(false);
    }
  }, [user, activeProfile?.id, windowDays]);

  const computeRef = useRef(compute);
  useEffect(() => { computeRef.current = compute; });

  useEffect(() => {
    setLoading(true);
    void computeRef.current();
  }, [user?.uid, activeProfile?.id, windowDays]);

  return { ...stats, loading, refresh: compute };
}
