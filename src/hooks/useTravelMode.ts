import { useState } from 'react';
import { useAuth, fetchCollection, updateDocument } from '@/integrations/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/client';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

interface TravelCalculation {
  medication: {
    id: string;
    name: string;
    dose_text: string;
    category: string;
  };
  dailyDoses: number;
  totalRequired: number;
  currentStock: number;
  needsToBuy: number;
  packingNotes: string;
}

export function useTravelMode() {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<TravelCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const calculateTravelNeeds = async (
    tripDays: number,
    destinationTimezone: string,
    bufferDays: number = 2
  ) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch active medications: users/{uid}/medications
      const { data: items } = await fetchCollection<any>(
        `users/${user.uid}/medications`,
        // where('isActive', '==', true) // Assuming field is isActive (camelCase)
      );
      // Client-side filter if needed, but assuming isActive is correct
      const activeItems = (items || []).filter(i => i.isActive !== false);

      // Fetch active schedules: users/{uid}/schedules
      const { data: allSchedules } = await fetchCollection<any>(
        `users/${user.uid}/schedules`
      );

      // Fetch stock: users/${user.uid}/stock
      const { data: allStock } = await fetchCollection<any>(
        `users/${user.uid}/stock`
      );

      const totalDays = tripDays + bufferDays;
      const results: TravelCalculation[] = [];

      for (const item of activeItems) {
        // Calculate daily doses based on schedule
        // Join schedules in memory
        const schedules = (allSchedules || []).filter(s => s.medicationId === item.id);
        // item also has stock mapping
        const stockItems = (allStock || []).filter(s => s.itemId === item.id);

        const schedule = schedules[0];
        let dailyDoses = 0;

        if (schedule) {
          const times = Array.isArray(schedule.times) ? schedule.times : [];

          if (schedule.freqType === 'daily' || schedule.freq_type === 'daily') {
            // Handling camelCase transition, check both or preferred
            dailyDoses = times.length;
          } else if (schedule.freqType === 'specific_days' || schedule.freq_type === 'specific_days') {
            const daysOfWeek = schedule.daysOfWeek || schedule.days_of_week || [];
            dailyDoses = (times.length * daysOfWeek.length) / 7;
          } else if (schedule.freqType === 'interval' || schedule.freq_type === 'interval') {
            dailyDoses = times.length; // Approximate for interval? Usually 24/interval * 1
            // Interval logic is trickier without more context, but keeping existing logic structure
            // Original code: dailyDoses = times.length;
            // Usually interval schedules don't have 'times' array but start time + interval.
            // If original code relied on times.length, we keep it.
          }
        }

        const totalRequired = Math.ceil(dailyDoses * totalDays);
        const currentStock = stockItems[0]?.unitsLeft || stockItems[0]?.units_left || 0;
        const needsToBuy = Math.max(0, totalRequired - currentStock);

        let packingNotes = '';
        if (item.category === 'medicamento') {
          packingNotes = 'Manter na embalagem original com receita';
        } else if (item.category === 'suplemento') {
          packingNotes = 'Pode ser transportado em organizador';
        }

        results.push({
          medication: {
            id: item.id,
            name: item.name,
            dose_text: item.doseText || item.dose_text || '',
            category: item.category || 'medicamento'
          },
          dailyDoses,
          totalRequired,
          currentStock,
          needsToBuy,
          packingNotes
        });
      }

      setCalculations(results);
    } catch (error) {
      console.error('Error calculating travel needs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const adjustSchedulesForTimezone = async (
    destinationTimezone: string,
    startDate: Date,
    endDate: Date
  ) => {
    if (!user) return;

    try {
      // Fetch all active medications with schedules
      // Join manually again
      // Or just fetch schedules directly since we iterate over them
      const { data: schedules } = await fetchCollection<any>(
        `users/${user.uid}/schedules`
      );

      const activeSchedules = (schedules || []).filter(s => s.isActive !== false);

      if (!activeSchedules.length) return;

      // For each schedule, adjust dose times
      for (const schedule of activeSchedules) {
        const times = Array.isArray(schedule.times) ? schedule.times : [];
        const adjustedTimes = times.map((time: string) => {
          // Parse time in current timezone
          const [hours, minutes] = time.split(':');
          const currentTime = new Date();
          currentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Convert to destination timezone
          const zonedTime = toZonedTime(currentTime, destinationTimezone);
          return formatInTimeZone(zonedTime, destinationTimezone, 'HH:mm');
        });

        // Update schedule with adjusted times
        await updateDocument(
          `users/${user.uid}/schedules`,
          schedule.id,
          { times: adjustedTimes }
        );
      }

      // Regenerate dose instances for travel period
      // Cloud Function call
      const generateTravelDosesFn = httpsCallable(functions, 'generateTravelDoses');
      await generateTravelDosesFn({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timezone: destinationTimezone
      });

    } catch (error) {
      console.error('Error adjusting schedules:', error);
    }
  };

  return {
    calculations,
    isLoading,
    calculateTravelNeeds,
    adjustSchedulesForTimezone
  };
}
