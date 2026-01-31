import { useState, useEffect, useCallback } from 'react';
import { useAuth, fetchCollection, fetchDocument, updateDocument, setDocument, orderBy, where } from '@/integrations/firebase';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { generateReferralCode } from '@/lib/referrals';



interface ReferralStats {
  referralCode: string; // referral_code
  totalReferrals: number;
  signupReferrals: number;
  activeReferrals: number;
  discountPercent: number; // discount_percent
  cyclesRemaining: number;
  goals: {
    signups_10: { current: number; target: number; completed: boolean };
    monthly_subs_5: { current: number; target: number; completed: boolean };
    annual_subs_3: { current: number; target: number; completed: boolean };
  };
  availableRewards: Array<{
    id: string;
    type: string; // reward_type
    status: string;
    expiresAt: string | null; // expires_at
  }>;
  recentReferrals: Array<{
    id: string;
    status: string;
    planType: string; // plan_type
    createdAt: string; // created_at
    activatedAt: string | null; // activated_at
  }>;
}

const defaultStats: ReferralStats = {
  referralCode: '',
  totalReferrals: 0,
  signupReferrals: 0,
  activeReferrals: 0,
  discountPercent: 0,
  cyclesRemaining: 6,
  goals: {
    signups_10: { current: 0, target: 10, completed: false },
    monthly_subs_5: { current: 0, target: 5, completed: false },
    annual_subs_3: { current: 0, target: 3, completed: false },
  },
  availableRewards: [],
  recentReferrals: [],
};

export function useReferralSystem() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [stats, setStats] = useState<ReferralStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [headerState, setHeaderState] = useState<'default' | 'new_referral' | 'discount_earned' | 'goal_close'>('default');

  const loadReferralData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Load referral code from profile
      const { data: profile } = await fetchDocument<any>(
        `users/${user.uid}/profile`,
        'me'
      );

      let referralCode = profile?.referralCode;

      // If user doesn't have a referral code, generate one
      if (!referralCode) {
        referralCode = generateReferralCode();

        // Save the referral code to the user's profile
        await setDocument(
          `users/${user.uid}/profile`,
          'me',
          {
            referralCode,
            userId: user.uid
          },
          true // merge
        );
      }

      // Load referrals: users/{uid}/referrals
      const { data: referrals } = await fetchCollection<any>(
        `users/${user.uid}/referrals`,
        [orderBy('createdAt', 'desc')]
      );

      // Load goals: users/{uid}/referralGoals
      const { data: goals } = await fetchCollection<any>(
        `users/${user.uid}/referralGoals`
      );

      // Load discount: users/{uid}/referralDiscount/current (or collection)
      // Assuming singleton or collection
      const { data: discounts } = await fetchCollection<any>(
        `users/${user.uid}/referralDiscount`
      );
      const discount = discounts && discounts.length > 0 ? discounts[0] : null;

      // Load available rewards: users/{uid}/referralRewards
      // We filter by status locally or via query if possible
      const { data: rewards } = await fetchCollection<any>(
        `users/${user.uid}/referralRewards`,
        [where('status', 'in', ['pending', 'granted'])]
      );

      // Calculate stats
      const signupCount = (referrals || []).filter(r => r.status === 'signup_completed' || r.status === 'active').length;
      const activeCount = (referrals || []).filter(r => r.status === 'active').length;

      const goalsMap = (goals || []).reduce((acc, g) => {
        acc[g.goalType] = { // goal_type
          current: g.currentCount, // current_count
          target: g.targetCount, // target_count
          completed: !!g.completedAt, // completed_at
        };
        return acc;
      }, {} as Record<string, { current: number; target: number; completed: boolean }>);

      setStats({
        referralCode: referralCode || '', // Use the generated or existing code
        totalReferrals: (referrals || []).length,
        signupReferrals: signupCount,
        activeReferrals: activeCount,
        discountPercent: discount?.discountPercent || 0, // discount_percent
        cyclesRemaining: discount ? discount.maxCycles - discount.cyclesUsed : 6, // max_cycles, cycles_used
        goals: {
          signups_10: goalsMap['signups_10'] || { current: 0, target: 10, completed: false },
          monthly_subs_5: goalsMap['monthly_subs_5'] || { current: 0, target: 5, completed: false },
          annual_subs_3: goalsMap['annual_subs_3'] || { current: 0, target: 3, completed: false },
        },
        availableRewards: (rewards || []).map(r => ({
          id: r.id,
          type: r.rewardType, // reward_type
          status: r.status,
          expiresAt: r.expiresAt, // expires_at
        })),
        recentReferrals: (referrals || []).slice(0, 10).map(r => ({
          id: r.id,
          status: r.status,
          planType: r.planType, // plan_type
          createdAt: r.createdAt, // created_at
          activatedAt: r.activatedAt, // activated_at
        })),
      });

      // Determine header state
      const hasNewReferral = (referrals || []).some(r => {
        const createdAt = new Date(r.createdAt);
        const now = new Date();
        return now.getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000; // Last 24h
      });

      const hasNewDiscount = (referrals || []).some(r => {
        if (!r.activatedAt) return false;
        const activatedAt = new Date(r.activatedAt);
        const now = new Date();
        return now.getTime() - activatedAt.getTime() < 24 * 60 * 60 * 1000;
      });

      const isCloseToGoal = Object.values(goalsMap).some((g: { current: number; target: number; completed: boolean }) =>
        !g.completed && g.current >= g.target - 2 && g.current < g.target
      );

      if (hasNewDiscount) {
        setHeaderState('discount_earned');
      } else if (hasNewReferral) {
        setHeaderState('new_referral');
      } else if (isCloseToGoal) {
        setHeaderState('goal_close');
      } else {
        setHeaderState('default');
      }

    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);

  const generateReferralLink = useCallback(() => {
    if (!stats.referralCode) return '';
    return `${window.location.origin}/auth?ref=${stats.referralCode}`;
  }, [stats.referralCode]);

  const claimReward = useCallback(async (rewardId: string) => {
    if (!user) return false;

    try {
      const { error } = await updateDocument(
        `users/${user.uid}/referralRewards`,
        rewardId,
        {
          status: 'claimed',
          claimedAt: new Date().toISOString() // claimed_at
        }
      );

      if (error) throw error;

      await loadReferralData();
      return true;
    } catch (error) {
      console.error('Error claiming reward:', error);
      return false;
    }
  }, [user, loadReferralData]);

  return {
    stats,
    loading,
    headerState,
    generateReferralLink,
    claimReward,
    refresh: loadReferralData,
    isPremium,
  };
}
