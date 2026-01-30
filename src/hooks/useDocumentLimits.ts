import { useState, useEffect } from "react";
import { auth, fetchCollection } from "@/integrations/firebase";
import { useSubscription } from "./useSubscription";

interface DocumentLimitsStats {
  currentCount: number;
  maxDocuments: number;
  canAddDocument: boolean;
  isPremium: boolean;
  remaining: number;
}

/**
 * Hook to manage Carteira de Saúde document limits
 * 
 * FREE users: Max 5 documents
 * PREMIUM users: Unlimited documents
 */
export function useDocumentLimits() {
  const { subscription, loading: subLoading } = useSubscription();
  const [stats, setStats] = useState<DocumentLimitsStats>({
    currentCount: 0,
    maxDocuments: 5,
    canAddDocument: false,
    isPremium: false,
    remaining: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDocumentStats();
  }, [subscription]);

  const loadDocumentStats = async () => {
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

      // Premium users have unlimited documents
      if (isPremium) {
        setStats({
          currentCount: 0,
          maxDocuments: Infinity,
          canAddDocument: true,
          isPremium: true,
          remaining: Infinity,
        });
        setIsLoading(false);
        return;
      }

      // Free users: count documents
      const { data, error } = await fetchCollection(`users/${user.uid}/healthDocuments`);

      if (error) throw error;

      const currentCount = data ? data.length : 0;
      const maxDocuments = 5;
      const remaining = Math.max(0, maxDocuments - currentCount);

      setStats({
        currentCount,
        maxDocuments,
        canAddDocument: currentCount < maxDocuments,
        isPremium: false,
        remaining,
      });
    } catch (error) {
      console.error('Error loading document limits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = loadDocumentStats;

  return {
    ...stats,
    isLoading,
    refresh,
  };
}
