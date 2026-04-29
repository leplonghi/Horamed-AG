/**
 * Hook to ensure dose instances are generated for the user's medications
 * This runs on app initialization and periodically to keep doses up-to-date
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCollection, where } from '@/integrations/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/client';
import { startOfDay, endOfDay, addDays } from 'date-fns';

const GENERATION_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
// v2: bump version to invalidate cached timestamps from before the CF fix
const STORAGE_KEY = 'last_dose_generation_v2';

export function useDoseGeneration() {
  const { user } = useAuth();
  const isGenerating = useRef(false);

  const generateDoses = useCallback(async (force = false) => {
    if (!user || isGenerating.current) return;

    isGenerating.current = true;
    const now = Date.now();

    try {
      // ── Step 1: Check active medications ───────────────────────────────
      const { data: medications } = await fetchCollection(
        `users/${user.uid}/medications`,
        []
      );
      const activeMeds = medications?.filter(m => m.isActive !== false) || [];

      if (activeMeds.length === 0) {
        console.log('[DoseGeneration] No active medications found');
        localStorage.setItem(STORAGE_KEY, now.toString());
        return;
      }

      // ── Step 2: Check what's actually in dose_instances TODAY ──────────
      // Do this BEFORE the throttle: if today is empty we must generate
      // regardless of when we last ran (old CF had a bug, generated 0 doses).
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());
      const next7Days = endOfDay(addDays(new Date(), 7));

      const { data: todayDoses } = await fetchCollection(
        "dose_instances",
        [
          where("userId", "==", user.uid),
          where("dueAt", ">=", todayStart.toISOString()),
          where("dueAt", "<=", todayEnd.toISOString()),
        ]
      );

      const todayCount = todayDoses?.length ?? 0;

      // ── Step 3: Apply throttle ONLY when today already has doses ────────
      if (!force && todayCount > 0) {
        const lastGeneration = localStorage.getItem(STORAGE_KEY);
        if (lastGeneration) {
          const lastTime = parseInt(lastGeneration, 10);
          if (now - lastTime < GENERATION_INTERVAL) {
            return; // Throttled — data is fresh
          }
        }
      }

      // ── Step 4: Check future pipeline ──────────────────────────────────
      const { data: futureDoses } = await fetchCollection(
        "dose_instances",
        [
          where("userId", "==", user.uid),
          where("status", "==", "scheduled"),
          where("dueAt", ">", todayEnd.toISOString()),
          where("dueAt", "<=", next7Days.toISOString()),
        ]
      );

      const futureCount = futureDoses?.length ?? 0;

      const needsGeneration =
        todayCount === 0 ||
        futureCount < activeMeds.length * 3; // at least 3 days ahead per medication

      if (needsGeneration) {
        console.log(`[DoseGeneration] Triggering CF: today=${todayCount}, future=${futureCount}, activeMeds=${activeMeds.length}`);
        const generateDoseInstances = httpsCallable(functions, 'generateDoseInstances');
        try {
          await generateDoseInstances({ days: 7 });
        } catch (error) {
          console.error('[DoseGeneration] Error calling CF:', error);
          return; // Don't update localStorage so next open retries
        }
      }

      localStorage.setItem(STORAGE_KEY, now.toString());
    } catch (error) {
      console.error('[DoseGeneration] Error:', error);
    } finally {
      isGenerating.current = false;
    }
  }, [user]);

  // Generate on mount and when user changes
  useEffect(() => {
    if (user) {
      const timeout = setTimeout(() => {
        generateDoses();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [user, generateDoses]);

  // Periodic check every 6 hours
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      generateDoses();
    }, GENERATION_INTERVAL);
    return () => clearInterval(interval);
  }, [user, generateDoses]);

  // Force regeneration on medication updates
  useEffect(() => {
    if (!user) return;
    let cleanup: (() => void) | undefined;
    import('@/lib/eventBus').then(({ eventBus, EVENTS }) => {
      cleanup = eventBus.on(EVENTS.MEDICATION_UPDATED, () => generateDoses(true));
    });
    return () => { if (cleanup) cleanup(); };
  }, [user, generateDoses]);

  return { generateDoses };
}

