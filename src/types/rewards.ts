/**
 * Sistema de Recompensas - Tipos TypeScript
 * 
 * Define a estrutura de dados para:
 * - Dias Premium grátis (Free users)
 * - Créditos em dinheiro (Premium users)
 * - Proteções de streak
 * - Programa de indicação
 * - Sorteios
 */

// ============================================
// RECOMPENSAS
// ============================================

export interface UserRewards {
    // Para usuários FREE
    premiumDays: PremiumDaysReward;

    // Para usuários PREMIUM
    credits: CreditsReward;

    // Para todos
    protections: StreakProtections;
    referrals: ReferralRewards;
}

// Dias Premium Grátis (Free users)
export interface PremiumDaysReward {
    earned: number;              // Total de dias ganhos
    used: number;                // Dias já usados
    remaining: number;           // Dias disponíveis
    active: boolean;             // Premium temporário ativo?
    activatedAt: Date | null;    // Quando ativou
    expiresAt: Date | null;      // Quando expira

    history: PremiumDayTransaction[];
}

export interface PremiumDayTransaction {
    date: Date;
    days: number;
    source: PremiumDaySource;
    type: 'earned' | 'used' | 'expired';
    description: string;
}

export type PremiumDaySource =
    | 'streak_7days'
    | 'streak_14days'
    | 'streak_30days'
    | 'streak_90days'
    | 'streak_365days'
    | 'social_share_streak'
    | 'social_share_achievement'
    | 'referral_signup'
    | 'referral_premium'
    | 'giveaway_winner'
    | 'admin_grant';

// Créditos em Dinheiro (Premium users)
export interface CreditsReward {
    balance: number;             // Saldo em R$
    currency: 'BRL' | 'USD';
    lifetime: number;            // Total ganho na vida

    transactions: CreditTransaction[];

    // Configurações
    autoApply: boolean;          // Aplicar automaticamente na renovação
    cashoutEnabled: boolean;     // Pode sacar via PIX
    minimumCashout: number;      // Mínimo para saque (R$ 50)
}

export interface CreditTransaction {
    id: string;
    date: Date;
    amount: number;              // Positivo = ganhou, Negativo = gastou
    source: CreditSource;
    type: 'earned' | 'spent' | 'refunded';
    description: string;
    metadata?: Record<string, any>;
}

export type CreditSource =
    | 'streak_7days'
    | 'streak_14days'
    | 'streak_30days'
    | 'streak_90days'
    | 'streak_365days'
    | 'social_share_streak'
    | 'social_share_achievement'
    | 'referral_signup'
    | 'referral_premium'
    | 'renewal_discount'
    | 'store_purchase'
    | 'admin_grant';

// Proteções de Streak
export interface StreakProtections {
    // Proteções mensais (Premium)
    monthly: {
        total: number;             // 3 por mês
        used: number;
        remaining: number;
        resetDate: Date;           // Próximo reset (dia 1)
    };

    // Proteções bônus (ganhas por conquistas)
    bonus: {
        total: number;
        used: number;
        remaining: number;
        sources: ProtectionSource[];
    };

    // Total disponível
    available: number;

    // Histórico de uso
    history: ProtectionUsage[];

    // Auto-proteção (Premium)
    autoProtect: {
        enabled: boolean;
        threshold: number;         // Usa proteção se streak > X dias
        notifications: boolean;
    };
}

export interface ProtectionSource {
    from: string;                // Ex: "14 dias de streak"
    amount: number;
    earnedAt: Date;
}

export interface ProtectionUsage {
    date: Date;
    streakSaved: number;
    reason: string;
    type: 'monthly' | 'bonus';
}

// Programa de Indicação
export interface ReferralRewards {
    code: string;                // Código único do usuário
    referred: string[];          // IDs dos usuários indicados
    premiumConversions: number;  // Quantos viraram Premium

    // Estatísticas
    stats: {
        totalSignups: number;
        totalPremium: number;
        totalEarned: number;       // Total ganho (dias ou créditos)
        conversionRate: number;    // % que virou Premium
    };

    // Recompensas ganhas
    rewards: ReferralReward[];
}

export interface ReferralReward {
    referredUserId: string;
    referredUserEmail: string;
    signupDate: Date;
    premiumDate: Date | null;
    rewardType: 'premium_days' | 'credits';
    rewardAmount: number;
    status: 'pending' | 'active' | 'churned';
}

// ============================================
// SORTEIOS
// ============================================

export interface Giveaway {
    id: string;
    title: string;
    description: string;
    type: GiveawayType;
    status: GiveawayStatus;

    // Prêmios
    prizes: {
        type: 'premium_month' | 'premium_annual' | 'credits' | 'swag';
        quantity: number;
        value: number;             // Valor em R$
        description: string;
    }[];

    // Datas
    startDate: Date;
    endDate: Date;
    drawnAt: Date | null;

    // Requisitos
    requirements: {
        mandatory: GiveawayRequirement[];
        bonus: GiveawayBonusChance[];
    };

    // Plataformas
    platforms: ('instagram' | 'tiktok' | 'twitter' | 'youtube')[];

    // Estatísticas
    stats: {
        totalParticipants: number;
        totalEntries: number;
        newFollowers: number;
        appDownloads: number;
        shareRate: number;
    };

    // Ganhadores
    winners: string[];           // User IDs

    // Custo e ROI
    cost: {
        prizes: number;
        ads: number;
        total: number;
    };

    revenue: {
        newPremium: number;
        ltv: number;
        roi: number;
    };
}

export type GiveawayType = 'monthly' | 'weekly' | 'special' | 'flash';
export type GiveawayStatus = 'draft' | 'active' | 'ended' | 'completed';

export interface GiveawayRequirement {
    type: 'follow' | 'like' | 'comment' | 'share' | 'tag_friends';
    platform: string;
    description: string;
}

export interface GiveawayBonusChance {
    type: string;
    chances: number;
    description: string;
}

// Participação no Sorteio
export interface GiveawayParticipation {
    userId: string;
    giveawayId: string;
    entries: number;             // Total de chances

    // Fontes de chances
    sources: ParticipationSource[];

    // Verificação social
    socialProof: {
        instagramUsername?: string;
        instagramFollows?: boolean;
        instagramCommented?: boolean;
        instagramShared?: boolean;
        commentScreenshot?: string;
        verified: boolean;
    };

    // Datas
    registeredAt: Date;
    lastUpdated: Date;
}

export interface ParticipationSource {
    type: ParticipationSourceType;
    chances: number;
    verifiedAt: Date;
}

export type ParticipationSourceType =
    | 'instagram_follow'
    | 'instagram_like'
    | 'instagram_comment'
    | 'instagram_share'
    | 'app_download'
    | 'app_streak_7days'
    | 'app_streak_30days'
    | 'app_referral'
    | 'daily_login';

// ============================================
// MILESTONES DE STREAK
// ============================================

export interface StreakMilestone {
    days: number;

    // Recompensas para Free
    freeReward: {
        premiumDays?: number;
        couponCode?: string;
        couponDiscount?: number;
        limit?: '1x' | 'unlimited';
    };

    // Recompensas para Premium
    premiumReward: {
        credits?: number;
        protections?: number;
        theme?: string;
        avatar?: string;
        badge?: string;
        report?: boolean;
        couponCode?: string;
        couponDiscount?: number;
        betaTester?: boolean;
        swag?: string;
    };

    // Metadata
    name: string;
    description: string;
    icon: string;
    claimed: boolean;
    claimedAt: Date | null;
}

// ============================================
// CONFIGURAÇÕES DO SISTEMA
// ============================================

export interface RewardsConfig {
    // Limites mensais (anti-abuso)
    limits: {
        free: {
            maxPremiumDaysViaStreaks: number;      // 30 dias/mês
            maxPremiumDaysViaSocial: number;       // 8 dias/mês
            maxPremiumDaysViaReferrals: number;    // 30 dias/mês
            totalMaxPerYear: number;               // 90 dias/ano
        };
        premium: {
            maxDiscountViaStreaks: number;         // 50% desconto
            maxBonusMonths: number;                // 6 meses/ano
            maxReferralBonus: 'unlimited';
        };
    };

    // Valores de recompensa
    streakRewards: StreakMilestone[];

    // Proteções
    protections: {
        monthlyAllowance: number;                // 3/mês
        bonusPerStreak7: number;                 // +1
        bonusPerStreak14: number;                // +2
        bonusPerShare: number;                   // +1
        bonusPerReferral: number;                // +3
    };

    // Indicações
    referral: {
        signupReward: {
            free: number;                          // 1 dia Premium
            premium: number;                       // R$ 5 créditos
        };
        premiumConversionReward: {
            free: number;                          // 30 dias Premium
            premium: number;                       // R$ 40 créditos
        };
        retentionRequired: number;               // 30 dias
    };
}
