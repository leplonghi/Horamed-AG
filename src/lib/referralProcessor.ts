import { supabase } from "@/integrations/supabase/client";

/**
 * Ativa referral quando usuário faz upgrade para premium
 */
export async function activateReferralOnUpgrade(
  userId: string, 
  planType: 'premium_monthly' | 'premium_annual'
): Promise<void> {
  try {
    // Buscar referral pendente para este usuário
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (!referral) {
      console.log('No pending referral found for user:', userId);
      return;
    }

    // Ativar referral
    const { error } = await supabase
      .from('referrals')
      .update({
        status: 'active',
        plan_type: planType,
        activated_at: new Date().toISOString()
      })
      .eq('id', referral.id);

    if (error) {
      console.error('Error activating referral:', error);
      throw error;
    }

    console.log('Referral activated successfully:', referral.id);
  } catch (error) {
    console.error('Error in activateReferralOnUpgrade:', error);
    // Não lançar erro para não bloquear o upgrade
  }
}

/**
 * Calcula desconto acumulado de referrals ativos para usuário premium
 */
export async function calculateReferralDiscount(userId: string): Promise<number> {
  try {
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('plan_type')
      .eq('referrer_user_id', userId)
      .eq('status', 'active');

    if (error || !referrals) {
      console.error('Error fetching referrals:', error);
      return 0;
    }

    let totalDiscount = 0;
    for (const referral of referrals) {
      if (referral.plan_type === 'premium_monthly') {
        totalDiscount += 20;
      } else if (referral.plan_type === 'premium_annual') {
        totalDiscount += 40;
      }
    }

    // Cap at 100%
    return Math.min(totalDiscount, 100);
  } catch (error) {
    console.error('Error calculating referral discount:', error);
    return 0;
  }
}

/**
 * Calcula slots extras de medicamentos para usuário free (via referrals)
 */
export async function calculateExtraSlots(userId: string): Promise<number> {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_user_id', userId)
      .eq('status', 'active')
      .gte('activated_at', monthStart.toISOString())
      .lte('activated_at', monthEnd.toISOString());

    if (error || !referrals) {
      console.error('Error fetching extra slots:', error);
      return 0;
    }

    // Max 3 slots por mês
    return Math.min(referrals.length, 3);
  } catch (error) {
    console.error('Error calculating extra slots:', error);
    return 0;
  }
}
