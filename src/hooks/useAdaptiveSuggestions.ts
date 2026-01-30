import { useEffect, useState } from 'react';
import { useAuth, fetchCollection, where, orderBy, limit } from '@/integrations/firebase';
import { differenceInDays } from 'date-fns';

interface AdaptiveSuggestion {
  type: 'reschedule' | 'extra_reminder' | 'streak_motivation';
  message: string;
  itemId?: string;
  itemName?: string;
  suggestedTime?: string;
}

/**
 * Hook para gerar sugestões adaptativas baseadas no comportamento do usuário
 */
export const useAdaptiveSuggestions = () => {
  const [suggestions, setSuggestions] = useState<AdaptiveSuggestion[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const analyzeBehavior = async () => {
      try {
        if (!user || !isMounted) return;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch recent dose history: users/{uid}/doses
        const { data: doses, error } = await fetchCollection<any>(
          `users/${user.uid}/doses`,
          [
            where('dueAt', '>=', sevenDaysAgo.toISOString()), // Changed to ISO comparison
            orderBy('dueAt', 'desc'),
            limit(100)
          ]
        );

        if (error) {
          console.error('Error fetching dose history:', error);
          return;
        }

        // Fetch items/medications to get names
        // Since we don't have join, fetch all active medications for naming lookup
        const { data: medications } = await fetchCollection<any>(
          `users/${user.uid}/medications`
        );
        const medMap = new Map((medications || []).map(m => [m.id, m]));

        const newSuggestions: AdaptiveSuggestion[] = [];

        // Group by medication
        const byMedication = (doses || []).reduce((acc: any, dose: any) => {
          // dose.itemId
          const med = medMap.get(dose.itemId);
          if (!med) return acc;

          if (!acc[dose.itemId]) {
            acc[dose.itemId] = { doses: [], name: med.name };
          }
          acc[dose.itemId].doses.push(dose);
          return acc;
        }, {} as Record<string, { doses: any[], name: string }>);

        // Analyze each medication
        Object.entries(byMedication as Record<string, { doses: any[], name: string }>).forEach(([itemId, { doses: medDoses, name }]) => {
          // Check for consistent delays
          const delays = medDoses
            .filter((d: any) => d.status === 'taken' && d.takenAt && d.dueAt)
            .map((d: any) => {
              const due = new Date(d.dueAt);
              const taken = new Date(d.takenAt);
              return (taken.getTime() - due.getTime()) / (1000 * 60); // minutes
            })
            .filter((delay: number) => delay > 30); // Only significant delays

          if (delays.length >= 3) {
            const avgDelay = delays.reduce((a: number, b: number) => a + b, 0) / delays.length;
            const avgDelayHours = Math.floor(avgDelay / 60);
            const avgDelayMinutes = Math.floor(avgDelay % 60);

            newSuggestions.push({
              type: 'reschedule',
              message: `Você costuma tomar ${name} com ${avgDelayHours}h${avgDelayMinutes}min de atraso. Quer ajustar o horário?`,
              itemId,
              itemName: name,
            });
          }

          // Check for frequent misses
          const missedCount = medDoses.filter((d: any) => d.status === 'missed').length;
          if (missedCount >= 3) {
            newSuggestions.push({
              type: 'extra_reminder',
              message: `${name} foi esquecido ${missedCount} vezes esta semana. Quer um lembrete extra?`,
              itemId,
              itemName: name,
            });
          }

          // Check for good streaks
          let currentStreak = 0;
          for (const dose of medDoses) {
            if (dose.status === 'taken') currentStreak++;
            else break;
          }

          if (currentStreak >= 7 && currentStreak % 7 === 0) {
            newSuggestions.push({
              type: 'streak_motivation',
              message: `🔥 Incrível! ${currentStreak} doses seguidas de ${name}. Continue assim!`,
              itemId,
              itemName: name,
            });
          }
        });

        if (isMounted) {
          setSuggestions(newSuggestions);
        }
      } catch (error) {
        console.error('Error analyzing behavior:', error);
      }
    };

    // Delay initial analysis to avoid blocking initial load
    const timeout = setTimeout(analyzeBehavior, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [user]);

  return { suggestions };
};
