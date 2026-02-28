import { useState, useEffect, useCallback } from "react";
import { auth, fetchCollection, fetchDocument, updateDocument, where } from "@/integrations/firebase";
import { useRewardHistory } from "@/hooks/useRewardHistory";
import { startOfDay, subDays, startOfWeek } from "date-fns";

interface ProfileDoc {
  tutorial_flags?: TutorialFlagsWithStreak;
}

interface StreakRecoveryData {
  missions_completed?: number;
  last_mission_date?: string;
  recovered_at?: string;
}

interface StreakProtectionFlags {
  week_start?: string;
  freezes_used_this_week?: number;
  last_freeze_date?: string;
  recovery?: StreakRecoveryData;
}

interface TutorialFlagsWithStreak {
  streak_protection?: StreakProtectionFlags;
  [key: string]: unknown;
}

interface StreakProtectionData {
  freezesAvailable: number;
  freezesUsedThisWeek: number;
  maxFreezesPerWeek: number;
  lastFreezeDate: string | null;
  streakAtRisk: boolean;
  recoveryMissionsCompleted: number;
  recoveryMissionsNeeded: number;
  canRecover: boolean;
}

interface StreakProtectionActions {
  useFreeze: () => Promise<boolean>;
  checkStreakRisk: () => Promise<boolean>;
  completeRecoveryMission: () => Promise<boolean>;
}

export function useStreakProtection() {
  const { logReward } = useRewardHistory();
  const [data, setData] = useState<StreakProtectionData>({
    freezesAvailable: 1,
    freezesUsedThisWeek: 0,
    maxFreezesPerWeek: 1,
    lastFreezeDate: null,
    streakAtRisk: false,
    recoveryMissionsCompleted: 0,
    recoveryMissionsNeeded: 3,
    canRecover: false,
  });
  const [loading, setLoading] = useState(true);

  const loadProtectionData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { data: profile } = await fetchDocument<ProfileDoc>(`users/${user.uid}/profile`, 'me');
      const streakData = (profile?.tutorial_flags as TutorialFlagsWithStreak | undefined)?.streak_protection || {};
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }).toISOString();

      // Reset weekly freeze if new week
      const freezesUsedThisWeek = streakData.week_start === weekStart
        ? (streakData.freezes_used_this_week ?? 0)
        : 0;

      // Check if streak is at risk (yesterday was missed) - Migrated to Firebase path
      const yesterday = startOfDay(subDays(new Date(), 1));

      const { data: yesterdayDoses } = await fetchCollection<any>(
        `users/${user.uid}/doses`,
        [
          where("dueAt", ">=", yesterday.toISOString()),
          where("dueAt", "<", startOfDay(new Date()).toISOString())
        ]
      );

      let streakAtRisk = false;
      if (yesterdayDoses && yesterdayDoses.length > 0) {
        const taken = yesterdayDoses.filter(d => d.status === "taken").length;
        const adherence = taken / yesterdayDoses.length;
        streakAtRisk = adherence < 0.8;
      }

      // Check recovery progress
      const recoveryData = streakData.recovery || {};
      const recoveryMissionsCompleted = recoveryData.missions_completed ?? 0;

      setData({
        freezesAvailable: 1 - (freezesUsedThisWeek as number),
        freezesUsedThisWeek: freezesUsedThisWeek as number,
        maxFreezesPerWeek: 1,
        lastFreezeDate: streakData.last_freeze_date ?? null,
        streakAtRisk,
        recoveryMissionsCompleted,
        recoveryMissionsNeeded: 3,
        canRecover: streakAtRisk && recoveryMissionsCompleted < 3,
      });
    } catch (error) {
      console.error("Error loading streak protection:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProtectionData();
  }, [loadProtectionData]);

  const useFreeze = async (): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user || data.freezesAvailable <= 0) return false;

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }).toISOString();

      const { data: profile } = await fetchDocument<ProfileDoc>(`users/${user.uid}/profile`, 'me');

      const currentFlags = (profile?.tutorial_flags as TutorialFlagsWithStreak) || {};
      const updatedFlags = {
        ...currentFlags,
        streak_protection: {
          ...currentFlags.streak_protection,
          week_start: weekStart,
          freezes_used_this_week: (data.freezesUsedThisWeek || 0) + 1,
          last_freeze_date: new Date().toISOString(),
        }
      };

      await updateDocument(`users/${user.uid}/profile`, 'me', { tutorial_flags: updatedFlags });

      // Log reward for freeze usage
      logReward({
        title: "Escudo Ativado",
        description: "Você usou um congelamento de streak para salvar sua sequência.",
        value: "-1 Freeze",
        type: "negative", // Subtracting a resource, but it's a positive action for the user
        date: new Date()
      });

      await loadProtectionData();
      return true;
    } catch (error) {
      console.error("Error using freeze:", error);
      return false;
    }
  };

  const checkStreakRisk = async (): Promise<boolean> => {
    await loadProtectionData();
    return data.streakAtRisk;
  };

  const completeRecoveryMission = async (): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      const { data: profile } = await fetchDocument<ProfileDoc>(`users/${user.uid}/profile`, 'me');

      const currentFlags = (profile?.tutorial_flags as TutorialFlagsWithStreak) || {};
      const newMissionsCompleted = (data.recoveryMissionsCompleted || 0) + 1;

      const recovery: StreakRecoveryData = {
        missions_completed: newMissionsCompleted,
        last_mission_date: new Date().toISOString(),
      };

      // If all missions completed, recover the streak
      if (newMissionsCompleted >= data.recoveryMissionsNeeded) {
        recovery.recovered_at = new Date().toISOString();
        recovery.missions_completed = 0;
      }

      const updatedFlags = {
        ...currentFlags,
        streak_protection: {
          ...currentFlags.streak_protection,
          recovery,
        }
      };

      await updateDocument(`users/${user.uid}/profile`, 'me', { tutorial_flags: updatedFlags });

      await loadProtectionData();

      if (newMissionsCompleted >= data.recoveryMissionsNeeded) {
        logReward({
          title: "Sequência Recuperada",
          description: `Você completou as missões e recuperou seu streak!`,
          value: "+50 XP",
          type: "positive",
          date: new Date()
        });
      }

      return newMissionsCompleted >= data.recoveryMissionsNeeded;
    } catch (error) {
      console.error("Error completing recovery mission:", error);
      return false;
    }
  };

  return {
    ...data,
    loading,
    actions: {
      useFreeze,
      checkStreakRisk,
      completeRecoveryMission,
    } as StreakProtectionActions,
    refresh: loadProtectionData,
  };
}
