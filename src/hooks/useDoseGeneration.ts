/**
 * Hook to ensure dose instances are generated for the user's medications
 * This runs on app initialization and periodically to keep doses up-to-date
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth, fetchCollection, where, orderBy } from '@/integrations/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/client';

const GENERATION_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
const STORAGE_KEY = 'last_dose_generation';

export function useDoseGeneration() {
  const { user } = useAuth();
  const isGenerating = useRef(false);

  const generateDoses = useCallback(async (force = false) => {
    if (!user || isGenerating.current) return;

    // Check if we recently generated doses
    const lastGeneration = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (!force && lastGeneration) {
      const lastTime = parseInt(lastGeneration, 10);
      if (now - lastTime < GENERATION_INTERVAL) {
        console.log('[DoseGeneration] Skipping - recently generated');
        return;
      }
    }

    isGenerating.current = true;

    try {
      console.log('[DoseGeneration] Checking if doses need to be generated...');

      // First, check if user has any active schedules
      // In Firebase: users/{uid}/schedules
      const { data: schedules } = await fetchCollection(
        `users/${user.uid}/schedules`,
        [where('isActive', '==', true)]
      );

      if (!schedules || schedules.length === 0) {
        console.log('[DoseGeneration] No active schedules for user');
        localStorage.setItem(STORAGE_KEY, now.toString());
        return;
      }

      // Check if we have doses for the next 24 hours
      const next24h = new Date(now + 24 * 60 * 60 * 1000);

      // In Firebase: users/{uid}/doses
      // We don't filter by schedule IDs here to avoid "in" limits, just date and status
      const { data: futureDoses } = await fetchCollection(
        `users/${user.uid}/doses`,
        [
          where('status', '==', 'scheduled'),
          where('dueAt', '>=', new Date()),
          where('dueAt', '<=', next24h)
        ]
      );

      console.log(`[DoseGeneration] Found ${futureDoses?.length || 0} scheduled doses in next 24h`);

      // If we have few or no doses, trigger generation
      if (!futureDoses || futureDoses.length < schedules.length) {
        console.log('[DoseGeneration] Triggering dose generation...');

        const generateDoseInstances = httpsCallable(functions, 'generateDoseInstances');

        try {
          const result = await generateDoseInstances({ days: 7 });
          console.log('[DoseGeneration] Success:', result.data);

          // Also trigger notification scheduling
          const scheduleDoseNotifications = httpsCallable(functions, 'scheduleDoseNotifications');
          await scheduleDoseNotifications();

        } catch (error) {
          console.error('[DoseGeneration] Error calling function:', error);
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
      // Small delay to let app initialize
      const timeout = setTimeout(() => {
        generateDoses();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [user, generateDoses]);

  // Also set up periodic check
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      generateDoses();
    }, GENERATION_INTERVAL);

    return () => clearInterval(interval);
  }, [user, generateDoses]);

  // Listen for medication updates (real-time integration)
  useEffect(() => {
    if (!user) return;

    const handler = () => {
      console.log('[DoseGeneration] Medication updated event received. Regenerating doses...');
      generateDoses(true); // Force regeneration
    };

    let cleanup: (() => void) | undefined;

    // Dynamic import to avoid cycles if any (though eventBus is lib)
    import('@/lib/eventBus').then(({ eventBus, EVENTS }) => {
      cleanup = eventBus.on(EVENTS.MEDICATION_UPDATED, handler);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [user, generateDoses]);

  return { generateDoses };
}
