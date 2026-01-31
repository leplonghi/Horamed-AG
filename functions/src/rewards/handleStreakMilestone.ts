/**
 * Cloud Function: Detectar Milestone de Streak
 * 
 * Trigger: Quando streak é atualizado
 * Ação: Verifica se atingiu milestone e adiciona recompensa
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Milestones de streak
const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

// Recompensas por milestone
const STREAK_REWARDS = {
    7: {
        free: { premiumDays: 1, protections: 0 },
        premium: { credits: 5, protections: 1, theme: 'fire' }
    },
    14: {
        free: { premiumDays: 2, protections: 0 },
        premium: { credits: 10, protections: 2, avatar: 'guardian' }
    },
    30: {
        free: { premiumDays: 7, coupon: 'STREAK30_20OFF' },
        premium: { credits: 20, coupon: 'RENEWAL10_10OFF', report: true }
    },
    60: {
        free: { premiumDays: 14, protections: 0 },
        premium: { credits: 40, badge: 'unstoppable' }
    },
    90: {
        free: { premiumDays: 30, limit: '1x' },
        premium: { credits: 60, badge: 'legendary' }
    },
    180: {
        free: { premiumDays: 60, limit: '1x' },
        premium: { credits: 120, badge: 'immortal' }
    },
    365: {
        free: { premiumDays: 90, limit: '1x' },
        premium: { credits: 240, betaTester: true, swag: 'tshirt' }
    }
};

export const handleStreakMilestone = functions.firestore
    .document('users/{userId}/streaks/current')
    .onUpdate(async (change, context) => {
        const userId = context.params.userId;
        const newStreak = change.after.data().current;
        const oldStreak = change.before.data().current;

        console.log(`Streak atualizado: ${oldStreak} → ${newStreak} (usuário: ${userId})`);

        // Verifica se atingiu algum milestone
        const newMilestone = STREAK_MILESTONES.find(m => newStreak >= m && oldStreak < m);

        if (!newMilestone) {
            console.log('Nenhum milestone atingido');
            return null;
        }

        console.log(`🎉 Milestone atingido: ${newMilestone} dias!`);

        // Busca informações do usuário
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        const userData = userDoc.data();

        if (!userData) {
            console.error('Usuário não encontrado');
            return null;
        }

        const isPremium = userData.subscription?.status === 'premium';
        const reward = STREAK_REWARDS[newMilestone as keyof typeof STREAK_REWARDS];

        if (!reward) {
            console.error('Recompensa não configurada para este milestone');
            return null;
        }

        // Aplica recompensa baseado no tipo de usuário
        if (isPremium) {
            await applyPremiumReward(userId, newMilestone, reward.premium);
        } else {
            await applyFreeReward(userId, newMilestone, reward.free);
        }

        // Envia notificação
        await sendMilestoneNotification(userId, newMilestone, isPremium, reward);

        // Registra milestone como conquistado
        await admin.firestore()
            .doc(`users/${userId}/achievements/streaks`)
            .set({
                [`milestone_${newMilestone}`]: {
                    achieved: true,
                    achievedAt: admin.firestore.FieldValue.serverTimestamp(),
                    reward: isPremium ? reward.premium : reward.free
                }
            }, { merge: true });

        console.log(`✅ Recompensa de milestone ${newMilestone} aplicada com sucesso`);

        return null;
    });

/**
 * Aplica recompensa para usuário Free
 */
async function applyFreeReward(
    userId: string,
    milestone: number,
    reward: any
): Promise<void> {
    const rewardsRef = admin.firestore().doc(`users/${userId}/rewards/premiumDays`);

    // Adiciona dias Premium
    if (reward.premiumDays) {
        await rewardsRef.set({
            earned: admin.firestore.FieldValue.increment(reward.premiumDays),
            remaining: admin.firestore.FieldValue.increment(reward.premiumDays),
            history: admin.firestore.FieldValue.arrayUnion({
                date: admin.firestore.FieldValue.serverTimestamp(),
                days: reward.premiumDays,
                source: `streak_${milestone}days`,
                type: 'earned',
                description: `Completou ${milestone} dias de streak`
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Adicionados ${reward.premiumDays} dias Premium`);
    }

    // Adiciona proteções (se houver)
    if (reward.protections) {
        const protectionsRef = admin.firestore().doc(`users/${userId}/rewards/protections`);
        await protectionsRef.set({
            'bonus.total': admin.firestore.FieldValue.increment(reward.protections),
            'bonus.remaining': admin.firestore.FieldValue.increment(reward.protections),
            'bonus.sources': admin.firestore.FieldValue.arrayUnion({
                from: `${milestone} dias de streak`,
                amount: reward.protections,
                earnedAt: admin.firestore.FieldValue.serverTimestamp()
            }),
            available: admin.firestore.FieldValue.increment(reward.protections),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Adicionadas ${reward.protections} proteções`);
    }
}

/**
 * Aplica recompensa para usuário Premium
 */
async function applyPremiumReward(
    userId: string,
    milestone: number,
    reward: any
): Promise<void> {
    const creditsRef = admin.firestore().doc(`users/${userId}/rewards/credits`);

    // Adiciona créditos
    if (reward.credits) {
        await creditsRef.set({
            balance: admin.firestore.FieldValue.increment(reward.credits),
            lifetime: admin.firestore.FieldValue.increment(reward.credits),
            currency: 'BRL',
            transactions: admin.firestore.FieldValue.arrayUnion({
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: admin.firestore.FieldValue.serverTimestamp(),
                amount: reward.credits,
                source: `streak_${milestone}days`,
                type: 'earned',
                description: `Completou ${milestone} dias de streak`
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Adicionados R$ ${reward.credits} em créditos`);
    }

    // Adiciona proteções extras
    if (reward.protections) {
        const protectionsRef = admin.firestore().doc(`users/${userId}/rewards/protections`);
        await protectionsRef.set({
            'bonus.total': admin.firestore.FieldValue.increment(reward.protections),
            'bonus.remaining': admin.firestore.FieldValue.increment(reward.protections),
            'bonus.sources': admin.firestore.FieldValue.arrayUnion({
                from: `${milestone} dias de streak`,
                amount: reward.protections,
                earnedAt: admin.firestore.FieldValue.serverTimestamp()
            }),
            available: admin.firestore.FieldValue.increment(reward.protections),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Adicionadas ${reward.protections} proteções extras`);
    }

    // Desbloqueia tema exclusivo
    if (reward.theme) {
        await admin.firestore()
            .doc(`users/${userId}/unlocks/themes`)
            .set({
                [reward.theme]: {
                    unlocked: true,
                    unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
                    source: `streak_${milestone}days`
                }
            }, { merge: true });

        console.log(`✅ Tema "${reward.theme}" desbloqueado`);
    }

    // Desbloqueia avatar exclusivo
    if (reward.avatar) {
        await admin.firestore()
            .doc(`users/${userId}/unlocks/avatars`)
            .set({
                [reward.avatar]: {
                    unlocked: true,
                    unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
                    source: `streak_${milestone}days`
                }
            }, { merge: true });

        console.log(`✅ Avatar "${reward.avatar}" desbloqueado`);
    }

    // Adiciona badge
    if (reward.badge) {
        await admin.firestore()
            .doc(`users/${userId}/unlocks/badges`)
            .set({
                [reward.badge]: {
                    unlocked: true,
                    unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
                    source: `streak_${milestone}days`
                }
            }, { merge: true });

        console.log(`✅ Badge "${reward.badge}" desbloqueado`);
    }

    // Ativa Beta Tester
    if (reward.betaTester) {
        await admin.firestore()
            .doc(`users/${userId}`)
            .update({
                betaTester: true,
                betaTesterSince: admin.firestore.FieldValue.serverTimestamp()
            });

        console.log(`✅ Beta Tester ativado`);
    }
}

/**
 * Envia notificação de milestone
 */
async function sendMilestoneNotification(
    userId: string,
    milestone: number,
    isPremium: boolean,
    reward: any
): Promise<void> {
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
        console.log('Usuário não tem FCM token');
        return;
    }

    const rewardText = isPremium
        ? `R$ ${reward.premium.credits} em créditos`
        : `${reward.free.premiumDays} dias Premium grátis`;

    const message = {
        token: fcmToken,
        notification: {
            title: `🎉 ${milestone} Dias de Streak!`,
            body: `Parabéns! Você ganhou ${rewardText}`,
        },
        data: {
            type: 'streak_milestone',
            milestone: milestone.toString(),
            reward: rewardText,
            screen: 'rewards'
        },
        android: {
            priority: 'high' as const,
            notification: {
                sound: 'default',
                channelId: 'rewards'
            }
        }
    };

    try {
        await admin.messaging().send(message);
        console.log(`✅ Notificação enviada para usuário ${userId}`);
    } catch (error) {
        console.error('Erro ao enviar notificação:', error);
    }
}
