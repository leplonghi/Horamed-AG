import {
  fetchCollection,
  fetchDocument,
  fetchCollectionGroup,
  setDocument,
  updateDocument,
  where,
  serverTimestamp
} from "@/integrations/firebase";

/**
 * Generate a unique referral code
 */
export function generateReferralCode(): string {
  const prefix = 'HR';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

/**
 * Get cumulative discount percentage from all active referrals for premium users
 */
export async function getReferralDiscountForUser(userId: string): Promise<number> {
  const { data: referrals, error } = await fetchCollection<any>(
    `users/${userId}/referrals`,
    [where('status', '==', 'active')]
  );

  if (error || !referrals) return 0;

  let totalDiscount = 0;
  for (const referral of referrals) {
    if (referral.planType === 'premium_monthly') {
      totalDiscount += 20;
    } else if (referral.planType === 'premium_annual') {
      totalDiscount += 40;
    }
  }

  // Cap at 100%
  return Math.min(totalDiscount, 100);
}

/**
 * Get number of extra active item slots earned via referrals (free users only)
 * Max 3 slots per month
 */
export async function getFreeExtraSlotsForUser(userId: string, currentMonth: Date): Promise<number> {
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const { data: referrals, error } = await fetchCollection<any>(
    `users/${userId}/referrals`,
    [
      where('status', '==', 'active'),
      where('activatedAt', '>=', monthStart.toISOString()),
      where('activatedAt', '<=', monthEnd.toISOString())
    ]
  );

  if (error || !referrals) return 0;

  // Each active referral = +1 slot, max 3 per month
  return Math.min(referrals.length, 3);
}

/**
 * Get user's effective max active items based on plan and referrals
 * Free: 1 + extra slots (from referrals)
 * Premium: Infinity (unlimited)
 */
export async function getUserEffectiveMaxActiveItems(userId: string): Promise<number> {
  // Get subscription from Firestore: users/{uid}/subscription/current
  const { data: subscription } = await fetchDocument<any>(
    `users/${userId}/subscription`,
    'current'
  );

  // Premium users have unlimited
  const isPremium = (
    subscription?.planType === 'premium' ||
    subscription?.planType === 'premium_individual' ||
    subscription?.planType === 'premium_family'
  ) && subscription?.status === 'active';

  if (isPremium) {
    return Infinity;
  }

  // Free users: 2 base (minimum viable routine) + extra slots from referrals
  const extraSlots = await getFreeExtraSlotsForUser(userId, new Date());
  return 2 + extraSlots;
}

/**
 * Check if user can activate another item
 */
export async function canUserActivateAnotherItem(userId: string): Promise<{
  allowed: boolean;
  currentActive: number;
  maxAllowed: number;
  isPremium: boolean;
}> {
  // Get current active items count from users/{uid}/items
  const { data: items } = await fetchCollection<any>(
    `users/${userId}/items`,
    [where('isActive', '==', true)]
  );

  const currentActive = items?.length || 0;
  const maxAllowed = await getUserEffectiveMaxActiveItems(userId);
  const isPremium = maxAllowed === Infinity;

  return {
    allowed: currentActive < maxAllowed,
    currentActive,
    maxAllowed: isPremium ? Infinity : maxAllowed,
    isPremium
  };
}

/**
 * Process referral on signup
 */
export async function processReferralOnSignup(referredUserId: string, referralCode: string): Promise<void> {
  // Find referrer by code in profile subcollection group
  const { data: profiles } = await fetchCollectionGroup<any>(
    'profile',
    [where('referralCode', '==', referralCode)]
  );

  const referrerProfile = profiles && profiles.length > 0 ? profiles[0] : null;

  if (!referrerProfile || !referrerProfile.userId) return;

  // Create pending referral under the referrer
  // users/{referrer_id}/referrals/{referred_user_id}
  await setDocument(
    `users/${referrerProfile.userId}/referrals`,
    referredUserId,
    {
      referrerUserId: referrerProfile.userId,
      referredUserId: referredUserId,
      referralCodeUsed: referralCode,
      planType: 'free',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  );
}

/**
 * Activate referral when user upgrades to premium
 */
export async function activateReferralOnUpgrade(userId: string, planType: 'premium_monthly' | 'premium_annual'): Promise<void> {
  // Find pending referral for this user across all users' referrals subcollections
  const { data: referrals } = await fetchCollectionGroup<any>(
    'referrals',
    [
      where('referredUserId', '==', userId),
      where('status', '==', 'pending')
    ]
  );

  const referral = referrals && referrals.length > 0 ? referrals[0] : null;

  if (!referral || !referral.referrerUserId) return;

  // Activate referral
  await updateDocument(
    `users/${referral.referrerUserId}/referrals`,
    referral.id, // referral.id is the referredUserId used as document id
    {
      status: 'active',
      planType: planType,
      activatedAt: new Date().toISOString()
    }
  );
}
