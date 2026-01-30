import { useCallback, useRef } from "react";
import { auth, fetchCollection, where, orderBy } from "@/integrations/firebase";
import { startOfDay, subDays } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  isImproving: boolean;
  lastWeekAverage: number;
  thisWeekAverage: number;
}

const CACHE_KEY = "streak-data";

export function useStreakCalculator() {
  const queryClient = useQueryClient();
  const lastFetchRef = useRef<number>(0);

  const calculateStreaks = useCallback(async (): Promise<StreakData> => {
    const defaultData: StreakData = {
      currentStreak: 0,
      longestStreak: 0,
      isImproving: false,
      lastWeekAverage: 0,
      thisWeekAverage: 0,
    };

    try {
      const user = auth.currentUser;
      if (!user) return defaultData;

      // Get all doses for the last 90 days
      const startDate = startOfDay(subDays(new Date(), 90));

      const { data: doses } = await fetchCollection<any>(
        `users/${user.uid}/doses`,
        [
          where("dueAt", ">=", startDate.toISOString()),
          orderBy("dueAt", "asc")
        ]
      );

      if (!doses || doses.length === 0) return defaultData;

      // Group doses by day and calculate adherence
      const dayMap = new Map<string, { total: number; taken: number }>();

      doses.forEach((dose) => {
        const day = startOfDay(new Date(dose.dueAt)).toISOString();
        const current = dayMap.get(day) || { total: 0, taken: 0 };
        current.total++;
        if (dose.status === "taken") current.taken++;
        dayMap.set(day, current);
      });

      // Calculate current streak (working backwards from today)
      let currentStreak = 0;
      let checkDate = startOfDay(new Date());

      while (true) {
        const dayKey = checkDate.toISOString();
        const dayData = dayMap.get(dayKey);

        if (!dayData) break;

        const adherence = dayData.taken / dayData.total;
        if (adherence >= 0.8) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      const sortedDays = Array.from(dayMap.entries()).sort();

      sortedDays.forEach(([, data]) => {
        const adherence = data.taken / data.total;
        if (adherence >= 0.8) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      });

      // Calculate last week vs this week average
      const thisWeekStart = startOfDay(subDays(new Date(), 6));
      const lastWeekStart = startOfDay(subDays(new Date(), 13));
      const lastWeekEnd = startOfDay(subDays(new Date(), 7));

      let thisWeekTaken = 0, thisWeekTotal = 0;
      let lastWeekTaken = 0, lastWeekTotal = 0;

      doses.forEach((dose) => {
        const doseDate = new Date(dose.dueAt);

        if (doseDate >= thisWeekStart) {
          thisWeekTotal++;
          if (dose.status === "taken") thisWeekTaken++;
        } else if (doseDate >= lastWeekStart && doseDate < lastWeekEnd) {
          lastWeekTotal++;
          if (dose.status === "taken") lastWeekTaken++;
        }
      });

      const thisWeekAverage = thisWeekTotal > 0 ? (thisWeekTaken / thisWeekTotal) * 100 : 0;
      const lastWeekAverage = lastWeekTotal > 0 ? (lastWeekTaken / lastWeekTotal) * 100 : 0;

      return {
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        isImproving: thisWeekAverage > lastWeekAverage,
        lastWeekAverage: Math.round(lastWeekAverage),
        thisWeekAverage: Math.round(thisWeekAverage),
      };
    } catch (error) {
      console.error("Error calculating streaks:", error);
      return defaultData;
    }
  }, []);

  const { data: streakData, isLoading: loading } = useQuery({
    queryKey: [CACHE_KEY],
    queryFn: calculateStreaks,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const refresh = useCallback(() => {
    // Throttle refreshes to prevent excessive calls
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) return; // 5 second throttle
    lastFetchRef.current = now;
    queryClient.invalidateQueries({ queryKey: [CACHE_KEY] });
  }, [queryClient]);

  return {
    currentStreak: streakData?.currentStreak ?? 0,
    longestStreak: streakData?.longestStreak ?? 0,
    isImproving: streakData?.isImproving ?? false,
    lastWeekAverage: streakData?.lastWeekAverage ?? 0,
    thisWeekAverage: streakData?.thisWeekAverage ?? 0,
    loading,
    refresh
  };
}