import { useState, useEffect } from "react";
import { auth, fetchCollection, where } from "@/integrations/firebase";
import { useSubscription } from "./useSubscription";
import { useUserProfiles } from "./useUserProfiles";

interface MedicationLimitsStats {
  activeCount: number;
  maxActive: number;
  canAddMedication: boolean;
  isPremium: boolean;
  remaining: number;
}

/**
 * Hook to manage medication limits
 * 
 * FREE users: Max 1 active medication
 * PREMIUM users: Unlimited medications
 * 
 * Enforces limits on medications collection where isActive = true
 */
export function useMedicationLimits() {
  const { subscription, loading: subLoading } = useSubscription();
  const { activeProfile } = useUserProfiles();
  const [stats, setStats] = useState<MedicationLimitsStats>({
    activeCount: 0,
    maxActive: 1,
    canAddMedication: false,
    isPremium: false,
    remaining: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMedicationStats();
  }, [subscription, activeProfile]);

  const loadMedicationStats = async () => {
    if (subLoading) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        return;
      }

      const planType = subscription?.planType || 'free';
      const status = subscription?.status || 'active';
      const isPremium = (planType === 'premium' || planType === 'premium_individual' || planType === 'premium_family') && status === 'active';

      // Premium users have unlimited medications
      if (isPremium) {
        setStats({
          activeCount: 0,
          maxActive: Infinity,
          canAddMedication: true,
          isPremium: true,
          remaining: Infinity,
        });
        setIsLoading(false);
        return;
      }

      // Free users: count active medications for current profile
      const userId = user.uid;
      const medsPath = `users/${userId}/medications`;

      const constraints = [where("isActive", "==", true)];
      if (activeProfile) {
        constraints.push(where("profileId", "==", activeProfile.id));
      }

      const { data: medsData, error } = await fetchCollection(medsPath, constraints);

      if (error) throw error;

      const activeCount = medsData?.length || 0;
      const maxActive = 1;
      const remaining = Math.max(0, maxActive - activeCount);

      setStats({
        activeCount,
        maxActive,
        canAddMedication: activeCount < maxActive,
        isPremium: false,
        remaining,
      });
    } catch (error) {
      console.error('Error loading medication limits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = loadMedicationStats;

  return {
    ...stats,
    isLoading,
    refresh,
  };
}
