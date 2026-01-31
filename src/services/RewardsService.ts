/**
 * Serviço de Recompensas
 * 
 * Gerencia:
 * - Dias Premium grátis (Free users)
 * - Créditos em dinheiro (Premium users)
 * - Proteções de streak
 * - Programa de indicação
 */

import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    arrayUnion,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import {
    UserRewards,
    PremiumDayTransaction,
    CreditTransaction,
    ProtectionUsage,
    ReferralReward,
    PremiumDaySource,
    CreditSource,
} from '@/types/rewards';
import {
    calculateStreakReward,
    calculateReferralReward,
    PROTECTION_CONFIG,
    REWARDS_LIMITS,
} from '@/config/rewards.config';

// ============================================
// DIAS PREMIUM GRÁTIS (FREE USERS)
// ============================================

/**
 * Adiciona dias Premium grátis para usuário Free
 */
export async function addPremiumDays(
    userId: string,
    days: number,
    source: PremiumDaySource,
    description: string
): Promise<void> {
    const rewardsRef = doc(db, `users/${userId}/rewards/premiumDays`);

    const transaction: PremiumDayTransaction = {
        date: new Date(),
        days,
        source,
        type: 'earned',
        description,
    };

    await setDoc(rewardsRef, {
        earned: increment(days),
        remaining: increment(days),
        history: arrayUnion(transaction),
        updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log(`✅ Adicionados ${days} dias Premium para usuário ${userId}`);
}

/**
 * Ativa dias Premium grátis
 */
export async function activatePremiumDays(
    userId: string,
    days: number
): Promise<{ success: boolean; expiresAt: Date }> {
    const rewardsRef = doc(db, `users/${userId}/rewards/premiumDays`);
    const rewardsDoc = await getDoc(rewardsRef);

    if (!rewardsDoc.exists()) {
        throw new Error('Usuário não tem dias Premium disponíveis');
    }

    const data = rewardsDoc.data();
    const remaining = data.remaining || 0;

    if (remaining < days) {
        throw new Error(`Dias insuficientes. Disponível: ${remaining}, Solicitado: ${days}`);
    }

    // Calcula data de expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Ativa Premium temporário
    const subscriptionRef = doc(db, `users/${userId}/subscription/temporary`);
    await setDoc(subscriptionRef, {
        status: 'premium',
        type: 'trial',
        startedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        source: 'reward',
        autoRenew: false,
    });

    // Atualiza dias usados
    const transaction: PremiumDayTransaction = {
        date: new Date(),
        days: -days,
        source: 'admin_grant',
        type: 'used',
        description: `Ativou ${days} dias Premium grátis`,
    };

    await updateDoc(rewardsRef, {
        used: increment(days),
        remaining: increment(-days),
        active: true,
        activatedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        history: arrayUnion(transaction),
    });

    console.log(`✅ Premium ativado para usuário ${userId} até ${expiresAt.toISOString()}`);

    return { success: true, expiresAt };
}

/**
 * Busca saldo de dias Premium
 */
export async function getPremiumDaysBalance(userId: string): Promise<number> {
    const rewardsRef = doc(db, `users/${userId}/rewards/premiumDays`);
    const rewardsDoc = await getDoc(rewardsRef);

    if (!rewardsDoc.exists()) return 0;

    return rewardsDoc.data().remaining || 0;
}

// ============================================
// CRÉDITOS (PREMIUM USERS)
// ============================================

/**
 * Adiciona créditos para usuário Premium
 */
export async function addCredits(
    userId: string,
    amount: number,
    source: CreditSource,
    description: string
): Promise<void> {
    const creditsRef = doc(db, `users/${userId}/rewards/credits`);

    const transaction: CreditTransaction = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date(),
        amount,
        source,
        type: 'earned',
        description,
    };

    await setDoc(creditsRef, {
        balance: increment(amount),
        lifetime: increment(amount),
        currency: 'BRL',
        transactions: arrayUnion(transaction),
        updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log(`✅ Adicionados R$ ${amount.toFixed(2)} em créditos para usuário ${userId}`);
}

/**
 * Usa créditos (desconto na renovação, compra na loja, etc)
 */
export async function useCredits(
    userId: string,
    amount: number,
    source: CreditSource,
    description: string
): Promise<void> {
    const creditsRef = doc(db, `users/${userId}/rewards/credits`);
    const creditsDoc = await getDoc(creditsRef);

    if (!creditsDoc.exists()) {
        throw new Error('Usuário não tem créditos');
    }

    const balance = creditsDoc.data().balance || 0;

    if (balance < amount) {
        throw new Error(`Créditos insuficientes. Disponível: R$ ${balance.toFixed(2)}, Solicitado: R$ ${amount.toFixed(2)}`);
    }

    const transaction: CreditTransaction = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date(),
        amount: -amount,
        source,
        type: 'spent',
        description,
    };

    await updateDoc(creditsRef, {
        balance: increment(-amount),
        transactions: arrayUnion(transaction),
        updatedAt: serverTimestamp(),
    });

    console.log(`✅ Usados R$ ${amount.toFixed(2)} em créditos do usuário ${userId}`);
}

/**
 * Busca saldo de créditos
 */
export async function getCreditsBalance(userId: string): Promise<number> {
    const creditsRef = doc(db, `users/${userId}/rewards/credits`);
    const creditsDoc = await getDoc(creditsRef);

    if (!creditsDoc.exists()) return 0;

    return creditsDoc.data().balance || 0;
}

// ============================================
// PROTEÇÕES DE STREAK
// ============================================

/**
 * Adiciona proteções de streak
 */
export async function addProtections(
    userId: string,
    amount: number,
    source: string
): Promise<void> {
    const protectionsRef = doc(db, `users/${userId}/rewards/protections`);

    await setDoc(protectionsRef, {
        'bonus.total': increment(amount),
        'bonus.remaining': increment(amount),
        'bonus.sources': arrayUnion({
            from: source,
            amount,
            earnedAt: serverTimestamp(),
        }),
        available: increment(amount),
        updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log(`✅ Adicionadas ${amount} proteções para usuário ${userId}`);
}

/**
 * Usa proteção de streak
 */
export async function useProtection(
    userId: string,
    streakSaved: number,
    reason: string
): Promise<{ success: boolean; remaining: number }> {
    const protectionsRef = doc(db, `users/${userId}/rewards/protections`);
    const protectionsDoc = await getDoc(protectionsRef);

    if (!protectionsDoc.exists()) {
        throw new Error('Usuário não tem proteções');
    }

    const data = protectionsDoc.data();
    const available = data.available || 0;

    if (available <= 0) {
        throw new Error('Sem proteções disponíveis');
    }

    // Decide se usa proteção mensal ou bônus
    const monthlyRemaining = data.monthly?.remaining || 0;
    const bonusRemaining = data.bonus?.remaining || 0;

    let type: 'monthly' | 'bonus';

    if (monthlyRemaining > 0) {
        type = 'monthly';
        await updateDoc(protectionsRef, {
            'monthly.used': increment(1),
            'monthly.remaining': increment(-1),
        });
    } else if (bonusRemaining > 0) {
        type = 'bonus';
        await updateDoc(protectionsRef, {
            'bonus.used': increment(1),
            'bonus.remaining': increment(-1),
        });
    } else {
        throw new Error('Erro ao usar proteção');
    }

    const usage: ProtectionUsage = {
        date: new Date(),
        streakSaved,
        reason,
        type,
    };

    await updateDoc(protectionsRef, {
        available: increment(-1),
        history: arrayUnion(usage),
        updatedAt: serverTimestamp(),
    });

    console.log(`✅ Proteção usada para salvar streak de ${streakSaved} dias`);

    return {
        success: true,
        remaining: available - 1,
    };
}

/**
 * Busca proteções disponíveis
 */
export async function getProtectionsAvailable(userId: string): Promise<number> {
    const protectionsRef = doc(db, `users/${userId}/rewards/protections`);
    const protectionsDoc = await getDoc(protectionsRef);

    if (!protectionsDoc.exists()) return 0;

    return protectionsDoc.data().available || 0;
}

// ============================================
// MILESTONE DE STREAK
// ============================================

/**
 * Processa milestone de streak e adiciona recompensa
 */
export async function handleStreakMilestone(
    userId: string,
    days: number,
    isPremium: boolean
): Promise<void> {
    const reward = calculateStreakReward(days, isPremium);

    if (!reward) {
        console.log(`Nenhuma recompensa para ${days} dias de streak`);
        return;
    }

    if (reward.type === 'premium_days') {
        await addPremiumDays(
            userId,
            reward.amount,
            `streak_${days}days` as PremiumDaySource,
            `Completou ${days} dias de streak`
        );
    } else {
        await addCredits(
            userId,
            reward.amount,
            `streak_${days}days` as CreditSource,
            `Completou ${days} dias de streak`
        );
    }

    console.log(`✅ Recompensa de streak processada: ${days} dias, ${reward.type}, ${reward.amount}`);
}

// ============================================
// PROGRAMA DE INDICAÇÃO
// ============================================

/**
 * Processa indicação de amigo
 */
export async function handleReferralSignup(
    referrerId: string,
    referredId: string,
    referredEmail: string
): Promise<void> {
    // Busca status de assinatura de ambos
    const referrerDoc = await getDoc(doc(db, `users/${referrerId}`));
    const referredDoc = await getDoc(doc(db, `users/${referredId}`));

    const referrerIsPremium = referrerDoc.data()?.subscription?.status === 'premium';
    const referredIsPremium = referredDoc.data()?.subscription?.status === 'premium';

    // Recompensa para quem indicou
    const referrerReward = calculateReferralReward('signup', referrerIsPremium, true);
    if (referrerReward.type === 'premium_days') {
        await addPremiumDays(referrerId, referrerReward.amount, 'referral_signup', `Indicou ${referredEmail}`);
    } else {
        await addCredits(referrerId, referrerReward.amount, 'referral_signup', `Indicou ${referredEmail}`);
    }

    // Recompensa para quem foi indicado
    const referredReward = calculateReferralReward('signup', referredIsPremium, false);
    if (referredReward.type === 'premium_days') {
        await addPremiumDays(referredId, referredReward.amount, 'referral_signup', `Cadastrou via indicação`);
    } else {
        await addCredits(referredId, referredReward.amount, 'referral_signup', `Cadastrou via indicação`);
    }

    // Registra indicação
    const referralReward: ReferralReward = {
        referredUserId: referredId,
        referredUserEmail: referredEmail,
        signupDate: new Date(),
        premiumDate: null,
        rewardType: referrerReward.type,
        rewardAmount: referrerReward.amount,
        status: 'pending',
    };

    const referralsRef = doc(db, `users/${referrerId}/rewards/referrals`);
    await setDoc(referralsRef, {
        referred: arrayUnion(referredId),
        'stats.totalSignups': increment(1),
        rewards: arrayUnion(referralReward),
        updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log(`✅ Indicação processada: ${referrerId} → ${referredEmail}`);
}

/**
 * Processa conversão de indicado para Premium
 */
export async function handleReferralPremiumConversion(
    referrerId: string,
    referredId: string
): Promise<void> {
    const referrerDoc = await getDoc(doc(db, `users/${referrerId}`));
    const referrerIsPremium = referrerDoc.data()?.subscription?.status === 'premium';

    const reward = calculateReferralReward('premiumConversion', referrerIsPremium, true);

    if (reward.type === 'premium_days') {
        await addPremiumDays(referrerId, reward.amount, 'referral_premium', `Indicado virou Premium`);
    } else {
        await addCredits(referrerId, reward.amount, 'referral_premium', `Indicado virou Premium`);
    }

    // Atualiza estatísticas
    const referralsRef = doc(db, `users/${referrerId}/rewards/referrals`);
    await updateDoc(referralsRef, {
        premiumConversions: increment(1),
        'stats.totalPremium': increment(1),
        updatedAt: serverTimestamp(),
    });

    console.log(`✅ Conversão Premium processada: ${referrerId} ganhou recompensa`);
}
