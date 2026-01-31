/**
 * Configuração do Sistema de Recompensas
 * 
 * Centraliza todos os valores, limites e regras de recompensas
 */

import { RewardsConfig, StreakMilestone } from '@/types/rewards';

// ============================================
// MILESTONES DE STREAK
// ============================================

export const STREAK_MILESTONES: StreakMilestone[] = [
    {
        days: 7,
        name: 'Semana Perfeita',
        description: 'Complete 7 dias consecutivos',
        icon: '🔥',
        claimed: false,
        claimedAt: null,
        freeReward: {
            premiumDays: 1,
        },
        premiumReward: {
            credits: 5,
            protections: 1,
            theme: 'fire',
        },
    },
    {
        days: 14,
        name: 'Duas Semanas Forte',
        description: 'Complete 14 dias consecutivos',
        icon: '🔥🔥',
        claimed: false,
        claimedAt: null,
        freeReward: {
            premiumDays: 2,
        },
        premiumReward: {
            credits: 10,
            protections: 2,
            avatar: 'guardian',
            theme: 'ocean',
        },
    },
    {
        days: 30,
        name: 'Mês de Ouro',
        description: 'Complete 30 dias consecutivos',
        icon: '🏆',
        claimed: false,
        claimedAt: null,
        freeReward: {
            premiumDays: 7,
            couponCode: 'STREAK30_20OFF',
            couponDiscount: 20,
        },
        premiumReward: {
            credits: 20,
            report: true,
            couponCode: 'RENEWAL10_10OFF',
            couponDiscount: 10,
            avatar: 'golden_guardian',
        },
    },
    {
        days: 60,
        name: 'Dois Meses Imparável',
        description: 'Complete 60 dias consecutivos',
        icon: '💎',
        claimed: false,
        claimedAt: null,
        freeReward: {
            premiumDays: 14,
        },
        premiumReward: {
            credits: 40,
            badge: 'unstoppable',
            theme: 'diamond',
        },
    },
    {
        days: 90,
        name: 'Trimestre Lendário',
        description: 'Complete 90 dias consecutivos',
        icon: '👑',
        claimed: false,
        claimedAt: null,
        freeReward: {
            premiumDays: 30,
            limit: '1x',
        },
        premiumReward: {
            credits: 60,
            badge: 'legendary',
            avatar: 'king',
        },
    },
    {
        days: 180,
        name: 'Semestre Imortal',
        description: 'Complete 180 dias consecutivos',
        icon: '⭐',
        claimed: false,
        claimedAt: null,
        freeReward: {
            premiumDays: 60,
            limit: '1x',
        },
        premiumReward: {
            credits: 120,
            badge: 'immortal',
            couponCode: 'RENEWAL50_50OFF',
            couponDiscount: 50,
        },
    },
    {
        days: 365,
        name: 'Ano Perfeito',
        description: 'Complete 365 dias consecutivos',
        icon: '🌟',
        claimed: false,
        claimedAt: null,
        freeReward: {
            premiumDays: 90,
            limit: '1x',
        },
        premiumReward: {
            credits: 240,
            betaTester: true,
            swag: 'tshirt',
            badge: 'perfect_year',
            avatar: 'legend',
        },
    },
];

// ============================================
// RECOMPENSAS SOCIAIS
// ============================================

export const SOCIAL_REWARDS = {
    // Compartilhar streak
    shareStreak: {
        free: {
            premiumDays: 1,
            maxPerMonth: 4,
        },
        premium: {
            credits: 2,
            maxPerMonth: 8,
        },
    },

    // Compartilhar conquista
    shareAchievement: {
        free: {
            premiumDays: 2,
        },
        premium: {
            credits: 10,
        },
    },

    // Transformação (antes/depois)
    shareTransformation: {
        free: {
            premiumDays: 5,
            maxPerMonth: 1,
        },
        premium: {
            credits: 20,
            maxPerMonth: 1,
        },
    },
};

// ============================================
// PROGRAMA DE INDICAÇÃO
// ============================================

export const REFERRAL_REWARDS = {
    // Amigo se cadastrou
    signup: {
        referrer: {
            free: 1,        // 1 dia Premium
            premium: 5,     // R$ 5 créditos
        },
        referred: {
            free: 1,        // 1 dia Premium
            premium: 5,     // R$ 5 créditos
        },
    },

    // Amigo completou 7 dias
    firstWeek: {
        referrer: {
            free: 3,        // 3 dias Premium
            premium: 10,    // R$ 10 créditos
        },
        referred: {
            free: 3,        // 3 dias Premium
            premium: 10,    // R$ 10 créditos
        },
    },

    // Amigo virou Premium
    premiumConversion: {
        referrer: {
            free: 30,       // 1 mês Premium
            premium: 40,    // R$ 40 créditos
        },
        retentionRequired: 30, // Precisa ficar 1 mês
    },

    // Milestones de indicação
    milestones: {
        2: {
            free: 30,       // 1 mês Premium
            premium: 40,    // R$ 40 créditos
        },
        5: {
            free: 180,      // 6 meses Premium
            premium: 240,   // R$ 240 créditos (12 meses grátis)
        },
        10: {
            free: 180,      // 6 meses Premium
            premium: 240,   // R$ 240 créditos (12 meses grátis)
        },
    },
};

// ============================================
// PROTEÇÕES DE STREAK
// ============================================

export const PROTECTION_CONFIG = {
    // Proteções mensais (Premium)
    monthlyAllowance: 3,

    // Proteções bônus
    bonus: {
        streak7Days: 1,
        streak14Days: 2,
        shareAchievement: 1,
        referralPremium: 3,
        weeklyChallenge: 1,
    },

    // Auto-proteção
    autoProtect: {
        defaultEnabled: true,
        defaultThreshold: 14, // Usa proteção se streak > 14 dias
    },
};

// ============================================
// LIMITES (ANTI-ABUSO)
// ============================================

export const REWARDS_LIMITS = {
    free: {
        maxPremiumDaysViaStreaks: 30,      // 30 dias/mês
        maxPremiumDaysViaSocial: 8,        // 8 dias/mês
        maxPremiumDaysViaReferrals: 30,    // 30 dias/mês
        totalMaxPerYear: 90,               // 90 dias/ano
    },

    premium: {
        maxDiscountViaStreaks: 50,         // 50% desconto máximo
        maxBonusMonths: 6,                 // 6 meses grátis/ano
        maxReferralBonus: Infinity,        // Ilimitado
    },
};

// ============================================
// CONFIGURAÇÃO COMPLETA
// ============================================

export const REWARDS_CONFIG: RewardsConfig = {
    limits: REWARDS_LIMITS,
    streakRewards: STREAK_MILESTONES,
    protections: PROTECTION_CONFIG,
    referral: REFERRAL_REWARDS,
};

// ============================================
// HELPERS
// ============================================

/**
 * Busca milestone de streak por número de dias
 */
export function getStreakMilestone(days: number): StreakMilestone | null {
    return STREAK_MILESTONES.find(m => m.days === days) || null;
}

/**
 * Busca próximo milestone de streak
 */
export function getNextStreakMilestone(currentDays: number): StreakMilestone | null {
    return STREAK_MILESTONES.find(m => m.days > currentDays) || null;
}

/**
 * Calcula recompensa por milestone
 */
export function calculateStreakReward(
    days: number,
    isPremium: boolean
): { type: 'premium_days' | 'credits'; amount: number } | null {
    const milestone = getStreakMilestone(days);
    if (!milestone) return null;

    if (isPremium) {
        return {
            type: 'credits',
            amount: milestone.premiumReward.credits || 0,
        };
    } else {
        return {
            type: 'premium_days',
            amount: milestone.freeReward.premiumDays || 0,
        };
    }
}

/**
 * Calcula recompensa por indicação
 */
export function calculateReferralReward(
    type: 'signup' | 'firstWeek' | 'premiumConversion',
    isPremium: boolean,
    isReferrer: boolean
): { type: 'premium_days' | 'credits'; amount: number } {
    const config = REFERRAL_REWARDS[type];
    const role = isReferrer ? 'referrer' : 'referred';

    if (isPremium) {
        return {
            type: 'credits',
            amount: config[role].premium,
        };
    } else {
        return {
            type: 'premium_days',
            amount: config[role].free,
        };
    }
}
