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
const STORAGE_KEY = 'last_dose_generation';

export function useDoseGeneration() {
  const { user } = useAuth();
  const isGenerating = useRef(false);

  const generateDoses = useCallback(async (force = false) => {
    if (!user || isGenerating.current) return;

    // Check if we recently generated doses (throttle to avoid excessive CF calls)
    const lastGeneration = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (!force && lastGeneration) {
      const lastTime = parseInt(lastGeneration, 10);
      if (now - lastTime < GENERATION_INTERVAL) {
        return;
      }
    }

    isGenerating.current = true;

    try {
      // First, check if user has any active schedules
      const { data: schedules } = await fetchCollection(
        `users/${user.uid}/schedules`,
        []
      );

      if (!schedules || schedules.length === 0) {
        localStorage.setItem(STORAGE_KEY, now.toString());
        return;
      }

      // Check if TODAY has enough dose instances (critical: use Date objects, not ISO strings,
      // so Firestore compares Timestamp == Timestamp, not Timestamp vs string)
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

      const { data: futureDoses } = await fetchCollection(
        "dose_instances",
        [
          where("userId", "==", user.uid),
          where("status", "==", "scheduled"),
          where("dueAt", ">", todayEnd.toISOString()),
          where("dueAt", "<=", next7Days.toISOString()),
        ]
      );

      const todayCount = todayDoses?.length ?? 0;
      const futureCount = futureDoses?.length ?? 0;

      // Regenerate if: today has no doses OR future pipeline is thin
      const needsGeneration =
        todayCount === 0 ||
        futureCount < schedules.length * 3; // at least 3 days ahead per schedule

      if (needsGeneration) {
        console.log(`[DoseGeneration] Triggering CF: today=${todayCount}, future=${futureCount}, schedules=${schedules.length}`);
        const generateDoseInstances = httpsCallable(functions, 'generateDoseInstances');
        try {
          await generateDoseInstances({ days: 7 });
          // Also trigger notification scheduling
          const scheduleDoseNotifications = httpsCallable(functions, 'scheduleDoseNotifications');
          await scheduleDoseNotifications();
        } catch (error) {
          console.error('[DoseGeneration] Error calling function:', error);
          // Don't update localStorage on CF error so next open retries
          return;
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

