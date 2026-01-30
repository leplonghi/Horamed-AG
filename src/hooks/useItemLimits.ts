import { useState, useEffect } from "react";
import { useAuth } from "@/integrations/firebase";
import { canUserActivateAnotherItem } from "@/lib/referrals";

export function useItemLimits() {
  const { user } = useAuth();
  const [canActivate, setCanActivate] = useState(true);
  const [currentActive, setCurrentActive] = useState(0);
  const [maxAllowed, setMaxAllowed] = useState(1);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkLimits();
    }
  }, [user]);

  const checkLimits = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const limits = await canUserActivateAnotherItem(user.uid);
      setCanActivate(limits.allowed);
      setCurrentActive(limits.currentActive);
      setMaxAllowed(limits.maxAllowed);
      setIsPremium(limits.isPremium);
    } catch (error) {
      console.error('Error checking item limits:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    canActivate,
    currentActive,
    maxAllowed,
    isPremium,
    loading,
    recheck: checkLimits
  };
}
