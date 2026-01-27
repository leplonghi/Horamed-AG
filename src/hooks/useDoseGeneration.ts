/**
 * Hook to ensure dose instances are generated for the user's medications
 * This runs on app initialization and periodically to keep doses up-to-date
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('id, item_id, items!inner(user_id, is_active)')
        .eq('is_active', true)
        .eq('items.user_id', user.id)
        .eq('items.is_active', true);

      if (schedulesError || !schedules || schedules.length === 0) {
        console.log('[DoseGeneration] No active schedules for user');
        localStorage.setItem(STORAGE_KEY, now.toString());
        return;
      }

      // Check if we have doses for the next 24 hours
      const next24h = new Date(now + 24 * 60 * 60 * 1000);
      const { count: futureDoses } = await supabase
        .from('dose_instances')
        .select('*', { count: 'exact', head: true })
        .in('schedule_id', schedules.map(s => s.id))
        .eq('status', 'scheduled')
        .gte('due_at', new Date().toISOString())
        .lte('due_at', next24h.toISOString());

      console.log(`[DoseGeneration] Found ${futureDoses || 0} scheduled doses in next 24h`);

      // If we have few or no doses, trigger generation
      if (!futureDoses || futureDoses < schedules.length) {
        console.log('[DoseGeneration] Triggering dose generation...');
        
        const { data, error } = await supabase.functions.invoke('generate-dose-instances', {
          body: { days: 7 }
        });

        if (error) {
          console.error('[DoseGeneration] Error:', error);
        } else {
          console.log('[DoseGeneration] Success:', data);
          
          // Also trigger notification scheduling
          await supabase.functions.invoke('schedule-dose-notifications');
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

  return { generateDoses };
}
