import { useState, useEffect } from "react";
import { getCurrentUser, fetchCollection, where, addDocument } from "@/integrations/firebase";
import { useSubscription } from "./useSubscription";
import { startOfDay, endOfDay, startOfToday, endOfToday } from "date-fns";

interface AIUsageStats {
  usedToday: number;
  dailyLimit: number;
  canUseAI: boolean;
  isPremium: boolean;
}

/**
 * Hook to manage AI Assistant usage limits
 * 
 * FREE users: 2 AI requests per day (resets at midnight)
 * PREMIUM users: Unlimited AI requests
 * 
 * Tracks usage in app_metrics collection with event_name='ai_assistant_query'
 */
export function useAILimits() {
  const { subscription, loading: subLoading } = useSubscription();
  const [stats, setStats] = useState<AIUsageStats>({
    usedToday: 0,
    dailyLimit: 2,
    canUseAI: false,
    isPremium: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAIUsage();
  }, [subscription, subLoading]);

  const loadAIUsage = async () => {
    if (subLoading) return;

    try {
      const user = await getCurrentUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const planType = subscription?.planType || 'free';
      const status = subscription?.status || 'active';
      const isPremium = planType === 'premium' && status === 'active';

      // Premium users have unlimited AI
      if (isPremium) {
        setStats({
          usedToday: 0,
          dailyLimit: Infinity,
          canUseAI: true,
          isPremium: true,
        });
        setIsLoading(false);
        return;
      }

      // Free users: count today's AI requests
      const dayStart = startOfToday();
      const dayEnd = endOfToday();

      const { data, error } = await fetchCollection('app_metrics', [
        where('user_id', '==', user.uid),
        where('event_name', '==', 'ai_assistant_query'),
        where('createdAt', '>=', dayStart),
        where('createdAt', '<=', dayEnd)
      ]);

      if (error) throw error;

      const usedToday = data?.length || 0;
      const dailyLimit = 2;

      setStats({
        usedToday,
        dailyLimit,
        canUseAI: usedToday < dailyLimit,
        isPremium: false,
      });
    } catch (error) {
      console.error('Error loading AI usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Record an AI usage event
   * Should be called AFTER the AI request is made successfully
   */
  const recordAIUsage = async (metadata?: Record<string, unknown>) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Don't record for premium users (they have unlimited)
      if (stats.isPremium) return;

      await addDocument('app_metrics', {
        user_id: user.uid,
        event_name: 'ai_assistant_query',
        event_data: metadata || {},
      });

      // Reload usage stats
      await loadAIUsage();
    } catch (error) {
      console.error('Error recording AI usage:', error);
    }
  };

  /**
   * Refresh usage stats manually
   */
  const refresh = loadAIUsage;

  return {
    ...stats,
    isLoading,
    recordAIUsage,
    refresh,
    remainingToday: stats.isPremium ? Infinity : Math.max(0, stats.dailyLimit - stats.usedToday),
  };
}
