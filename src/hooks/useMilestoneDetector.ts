import { useState, useEffect, useCallback, useRef } from "react";
import { useStreakCalculator } from "./useStreakCalculator";
import { useRewardHistory } from "./useRewardHistory";
import { useSubscription } from "./useSubscription";

export type MilestoneType = 7 | 30 | 90;

interface MilestoneState {
  milestone: MilestoneType | null;
  isNew: boolean;
}

const MILESTONE_KEY = "horamed_last_milestone";

export function useMilestoneDetector() {
  const { currentStreak } = useStreakCalculator();
  const { isPremium } = useSubscription();
  const { logReward } = useRewardHistory();
  const [milestoneState, setMilestoneState] = useState<MilestoneState>({
    milestone: null,
    isNew: false,
  });

  // Track logged milestones in this session to avoid double logs if React re-renders
  const lastLoggedRef = useRef<number>(0);

  const checkForNewMilestone = useCallback(() => {
    const lastMilestone = parseInt(localStorage.getItem(MILESTONE_KEY) || "0");
    const sessionLastLogged = lastLoggedRef.current;

    let currentMilestone: MilestoneType | null = null;

    if (currentStreak >= 90 && lastMilestone < 90) {
      currentMilestone = 90;
    } else if (currentStreak >= 30 && lastMilestone < 30) {
      currentMilestone = 30;
    } else if (currentStreak >= 7 && lastMilestone < 7) {
      currentMilestone = 7;
    }

    if (currentMilestone && currentMilestone > sessionLastLogged) {
      setMilestoneState({ milestone: currentMilestone, isNew: true });

      // Log to Firestore
      const value = isPremium ? "+$5 Créditos" : "+1 dia Premium";
      logReward({
        title: `Série de ${currentMilestone} dias completada!`,
        description: `Você alcançou a marca de ${currentMilestone} dias sem falhas.`,
        date: new Date(),
        value: value,
        type: "positive"
      });

      lastLoggedRef.current = currentMilestone;
    }
  }, [currentStreak, logReward, isPremium]);

  useEffect(() => {
    checkForNewMilestone();
  }, [checkForNewMilestone]);

  const markMilestoneAsSeen = useCallback(() => {
    if (milestoneState.milestone) {
      localStorage.setItem(MILESTONE_KEY, milestoneState.milestone.toString());
      setMilestoneState({ milestone: null, isNew: false });
    }
  }, [milestoneState.milestone]);

  const resetMilestone = useCallback(() => {
    setMilestoneState({ milestone: null, isNew: false });
  }, []);

  return {
    milestone: milestoneState.milestone,
    isNewMilestone: milestoneState.isNew,
    markAsSeen: markMilestoneAsSeen,
    reset: resetMilestone,
  };
}

