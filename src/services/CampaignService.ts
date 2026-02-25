import { db, setDocument } from "@/integrations/firebase";
import { doc, runTransaction, serverTimestamp, increment, query, where, getDocs, collection } from "firebase/firestore";

export type CampaignType = 'vip_ambassador' | 'flash_weekly' | 'keyword_dm' | 'whatsapp_group' | 'referral' | 'engagement_post' | 'reply_assistant';
export type CampaignStrategy = 'embaixador' | 'flash' | 'keyword' | 'whatsapp' | 'referral' | 'engagement' | 'reply_pack';

export interface CampaignRule {
    code: string;
    type: CampaignType;
    strategy: CampaignStrategy;
    maxRedemptions: number;
    currentRedemptions: number;
    benefitDays: number;
    isActive: boolean;
    requirements: {
        feedbackRequired: boolean;
        retentionLockDays: number;
    };
    description: string;
    createdAt?: string;
    metadata?: {
        niche?: string;
        platform?: string;
        channel?: string;
        tone?: string;
        groupType?: string;
        groups?: string[];
        postStyle?: string;
        postType?: string;
        purpose?: string;
        copy?: string;
        createdAt?: string;
    };
}

// Fallback when limit is reached
const FALLBACK_STANDARD_TRIAL: CampaignRule = {
    code: 'fallback_standard',
    type: 'flash_weekly',
    strategy: 'flash',
    maxRedemptions: 999999,
    currentRedemptions: 0,
    benefitDays: 7,
    isActive: true,
    requirements: {
        feedbackRequired: false,
        retentionLockDays: 0
    },
    description: "Fallback Trial (Limite atingido)"
};

// Predefined Campaign Templates
export const CAMPAIGN_TEMPLATES: Record<CampaignStrategy, Omit<CampaignRule, 'code' | 'createdAt'>> = {
    embaixador: {
        type: 'vip_ambassador',
        strategy: 'embaixador',
        maxRedemptions: 30,
        currentRedemptions: 0,
        benefitDays: 90,
        isActive: true,
        requirements: {
            feedbackRequired: true,
            retentionLockDays: 7
        },
        description: "Lote Embaixador VIP - Círculo Íntimo"
    },
    flash: {
        type: 'flash_weekly',
        strategy: 'flash',
        maxRedemptions: 50,
        currentRedemptions: 0,
        benefitDays: 14,
        isActive: true,
        requirements: {
            feedbackRequired: false,
            retentionLockDays: 0
        },
        description: "Lote Flash Semanal - Redes Sociais"
    },
    keyword: {
        type: 'keyword_dm',
        strategy: 'keyword',
        maxRedemptions: 100,
        currentRedemptions: 0,
        benefitDays: 30,
        isActive: true,
        requirements: {
            feedbackRequired: false,
            retentionLockDays: 0
        },
        description: "Lote Keyword DM - Engajamento"
    },
    whatsapp: {
        type: 'whatsapp_group',
        strategy: 'whatsapp',
        maxRedemptions: 200,
        currentRedemptions: 0,
        benefitDays: 30,
        isActive: true,
        requirements: {
            feedbackRequired: false,
            retentionLockDays: 0
        },
        description: "Lote WhatsApp Groups - Comunidades"
    },
    referral: {
        type: 'referral',
        strategy: 'referral',
        maxRedemptions: 999999,
        currentRedemptions: 0,
        benefitDays: 30,
        isActive: true,
        requirements: {
            feedbackRequired: false,
            retentionLockDays: 0
        },
        description: "Indicação de Usuário"
    },
    engagement: {
        type: 'engagement_post',
        strategy: 'engagement',
        maxRedemptions: 999999, // Engagement doesn't usually use codes, but we keep it for consistency
        currentRedemptions: 0,
        benefitDays: 0,
        isActive: true,
        requirements: {
            feedbackRequired: false,
            retentionLockDays: 0
        },
        description: "Post de Engajamento"
    },
    reply_pack: {
        type: 'reply_assistant',
        strategy: 'reply_pack',
        maxRedemptions: 999999,
        currentRedemptions: 0,
        benefitDays: 0,
        isActive: true,
        requirements: {
            feedbackRequired: false,
            retentionLockDays: 0
        },
        description: "Assistente de Respostas"
    }
};

export const CampaignService = {

    async createCampaign(campaign: CampaignRule) {
        const campaignWithTimestamp = {
            ...campaign,
            createdAt: new Date().toISOString()
        };
        await setDocument("campaigns", campaign.code, campaignWithTimestamp);
        return campaignWithTimestamp;
    },

    async applyCampaignToUser(userId: string, campaignCode?: string): Promise<{
        success: boolean;
        appliedRule: CampaignRule;
        limitExceeded?: boolean;
        message?: string;
    }> {
        if (!campaignCode) {
            return {
                success: true,
                appliedRule: FALLBACK_STANDARD_TRIAL,
                message: "Bem-vindo! Aproveite seu trial de 7 dias."
            };
        }

        const ruleRef = doc(db, "campaigns", campaignCode);

        try {
            const result = await runTransaction(db, async (transaction) => {
                const ruleDoc = await transaction.get(ruleRef);

                if (!ruleDoc.exists()) {
                    return { rule: null, exceeded: false };
                }

                const rule = ruleDoc.data() as CampaignRule;

                if (!rule.isActive) {
                    return { rule: null, exceeded: false };
                }

                // Check if limit exceeded
                if (rule.currentRedemptions >= rule.maxRedemptions) {
                    return { rule: FALLBACK_STANDARD_TRIAL, exceeded: true };
                }

                // Increment counter
                transaction.update(ruleRef, {
                    currentRedemptions: increment(1)
                });

                return { rule, exceeded: false };
            });

            if (!result.rule) {
                return {
                    success: true,
                    appliedRule: FALLBACK_STANDARD_TRIAL,
                    message: "Cupom inválido. Liberamos um trial padrão pra você!"
                };
            }

            // Apply benefits to user
            const now = new Date();
            const trialEndsAt = new Date();
            trialEndsAt.setDate(now.getDate() + result.rule.benefitDays);

            await setDocument(`users/${userId}/profile`, 'me', {
                campaignId: result.rule.code,
                campaignType: result.rule.type,
                premiumStatus: 'trial',
                trialEndsAt: trialEndsAt.toISOString(),
                feedbackRequired: result.rule.requirements.feedbackRequired,
                feedbackLockDate: result.rule.requirements.retentionLockDays > 0
                    ? new Date(Date.now() + (result.rule.requirements.retentionLockDays * 24 * 60 * 60 * 1000)).toISOString()
                    : null,
                isFeedbackCompleted: false,
                joinedAt: serverTimestamp()
            }, true);

            if (result.exceeded) {
                return {
                    success: true,
                    appliedRule: result.rule,
                    limitExceeded: true,
                    message: "Opa! As vagas VIP acabaram 😔 Mas liberamos um trial especial de 7 dias pra você!"
                };
            }

            return {
                success: true,
                appliedRule: result.rule,
                message: `Parabéns! Você ganhou ${result.rule.benefitDays} dias de Premium! 🎉`
            };

        } catch (error) {
            console.error("Campaign Redemption Error:", error);
            return {
                success: false,
                appliedRule: FALLBACK_STANDARD_TRIAL,
                message: "Algo deu errado, mas liberamos um trial pra você!"
            };
        }
    },

    async listActiveCampaigns(): Promise<CampaignRule[]> {
        try {
            const campaignsRef = collection(db, "campaigns");
            const q = query(campaignsRef, where("isActive", "==", true));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                ...doc.data() as CampaignRule,
                code: doc.id
            }));
        } catch (error) {
            console.error("Error listing campaigns:", error);
            return [];
        }
    },

    generateCode(strategy: CampaignStrategy, suffix?: string): string {
        const prefixes: Record<CampaignStrategy, string> = {
            embaixador: 'VIP',
            flash: 'FLASH',
            keyword: 'KEY',
            whatsapp: 'WPP',
            referral: 'REF',
            engagement: 'ENG',
            reply_pack: 'REP'
        };

        const prefix = prefixes[strategy];
        const timestamp = Date.now().toString().slice(-6);
        const cleanSuffix = suffix ? suffix.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) : '';

        return `${prefix}_${cleanSuffix || timestamp}`;
    }
};
