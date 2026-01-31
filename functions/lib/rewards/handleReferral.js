"use strict";
/**
 * Cloud Function: Processar Indicação de Amigo
 *
 * Trigger: Quando novo usuário se cadastra com código de indicação
 * Ação: Adiciona recompensa para quem indicou e quem foi indicado
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReferralPremiumConversion = exports.handleReferralFirstWeek = exports.handleReferralSignup = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Recompensas de indicação
const REFERRAL_REWARDS = {
    signup: {
        referrer: { free: 1, premium: 5 }, // 1 dia ou R$ 5
        referred: { free: 1, premium: 5 }
    },
    firstWeek: {
        referrer: { free: 3, premium: 10 }, // 3 dias ou R$ 10
        referred: { free: 3, premium: 10 }
    },
    premiumConversion: {
        referrer: { free: 30, premium: 40 }, // 1 mês ou R$ 40
        retentionRequired: 30 // Precisa ficar 1 mês
    }
};
/**
 * Trigger: Novo usuário criado
 */
exports.handleReferralSignup = functions.firestore
    .document('users/{userId}')
    .onCreate(async (snap, context) => {
    var _a, _b;
    const userId = context.params.userId;
    const userData = snap.data();
    // Verifica se tem código de indicação
    const referralCode = userData.referralCode;
    if (!referralCode) {
        console.log('Usuário não usou código de indicação');
        return null;
    }
    console.log(`Novo usuário ${userId} com código de indicação: ${referralCode}`);
    // Busca quem indicou
    const referrersQuery = await admin.firestore()
        .collection('users')
        .where('referralCode', '==', referralCode)
        .limit(1)
        .get();
    if (referrersQuery.empty) {
        console.error('Código de indicação inválido');
        return null;
    }
    const referrerDoc = referrersQuery.docs[0];
    const referrerId = referrerDoc.id;
    const referrerData = referrerDoc.data();
    console.log(`Indicado por: ${referrerId} (${referrerData.email})`);
    // Verifica status de assinatura de ambos
    const referrerIsPremium = ((_a = referrerData.subscription) === null || _a === void 0 ? void 0 : _a.status) === 'premium';
    const referredIsPremium = ((_b = userData.subscription) === null || _b === void 0 ? void 0 : _b.status) === 'premium';
    // Adiciona recompensa para quem indicou
    await addReferralReward(referrerId, referrerIsPremium, REFERRAL_REWARDS.signup.referrer, `Indicou ${userData.email}`, 'signup');
    // Adiciona recompensa para quem foi indicado
    await addReferralReward(userId, referredIsPremium, REFERRAL_REWARDS.signup.referred, 'Cadastrou via indicação', 'signup');
    // Registra indicação
    const referralReward = {
        referredUserId: userId,
        referredUserEmail: userData.email,
        signupDate: admin.firestore.FieldValue.serverTimestamp(),
        premiumDate: null,
        rewardType: referrerIsPremium ? 'credits' : 'premium_days',
        rewardAmount: referrerIsPremium
            ? REFERRAL_REWARDS.signup.referrer.premium
            : REFERRAL_REWARDS.signup.referrer.free,
        status: 'pending'
    };
    await admin.firestore()
        .doc(`users/${referrerId}/rewards/referrals`)
        .set({
        referred: admin.firestore.FieldValue.arrayUnion(userId),
        'stats.totalSignups': admin.firestore.FieldValue.increment(1),
        rewards: admin.firestore.FieldValue.arrayUnion(referralReward),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    // Envia notificações
    await sendReferralNotification(referrerId, 'signup', userData.email);
    await sendWelcomeReferralNotification(userId, referrerData.email);
    console.log(`✅ Indicação processada com sucesso`);
    return null;
});
/**
 * Trigger: Usuário completou 7 dias
 */
exports.handleReferralFirstWeek = functions.firestore
    .document('users/{userId}/streaks/current')
    .onUpdate(async (change, context) => {
    var _a, _b;
    const userId = context.params.userId;
    const newStreak = change.after.data().current;
    const oldStreak = change.before.data().current;
    // Verifica se completou 7 dias
    if (newStreak >= 7 && oldStreak < 7) {
        console.log(`Usuário ${userId} completou 7 dias de streak`);
        // Busca se foi indicado
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.referralCode)) {
            console.log('Usuário não foi indicado');
            return null;
        }
        // Busca quem indicou
        const referrersQuery = await admin.firestore()
            .collection('users')
            .where('referralCode', '==', userData.referralCode)
            .limit(1)
            .get();
        if (referrersQuery.empty) {
            console.error('Indicador não encontrado');
            return null;
        }
        const referrerDoc = referrersQuery.docs[0];
        const referrerId = referrerDoc.id;
        const referrerData = referrerDoc.data();
        const referrerIsPremium = ((_a = referrerData.subscription) === null || _a === void 0 ? void 0 : _a.status) === 'premium';
        const referredIsPremium = ((_b = userData.subscription) === null || _b === void 0 ? void 0 : _b.status) === 'premium';
        // Adiciona recompensa de primeira semana
        await addReferralReward(referrerId, referrerIsPremium, REFERRAL_REWARDS.firstWeek.referrer, `${userData.email} completou 7 dias`, 'firstWeek');
        await addReferralReward(userId, referredIsPremium, REFERRAL_REWARDS.firstWeek.referred, 'Completou primeira semana', 'firstWeek');
        // Envia notificação
        await sendReferralNotification(referrerId, 'firstWeek', userData.email);
        console.log(`✅ Recompensa de primeira semana aplicada`);
    }
    return null;
});
/**
 * Trigger: Usuário virou Premium
 */
exports.handleReferralPremiumConversion = functions.firestore
    .document('users/{userId}/subscription')
    .onUpdate(async (change, context) => {
    var _a;
    const userId = context.params.userId;
    const newStatus = change.after.data().status;
    const oldStatus = change.before.data().status;
    // Verifica se virou Premium
    if (newStatus === 'premium' && oldStatus !== 'premium') {
        console.log(`Usuário ${userId} virou Premium`);
        // Busca se foi indicado
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.referralCode)) {
            console.log('Usuário não foi indicado');
            return null;
        }
        // Busca quem indicou
        const referrersQuery = await admin.firestore()
            .collection('users')
            .where('referralCode', '==', userData.referralCode)
            .limit(1)
            .get();
        if (referrersQuery.empty) {
            console.error('Indicador não encontrado');
            return null;
        }
        const referrerDoc = referrersQuery.docs[0];
        const referrerId = referrerDoc.id;
        const referrerData = referrerDoc.data();
        const referrerIsPremium = ((_a = referrerData.subscription) === null || _a === void 0 ? void 0 : _a.status) === 'premium';
        // Adiciona recompensa de conversão Premium
        await addReferralReward(referrerId, referrerIsPremium, REFERRAL_REWARDS.premiumConversion.referrer, `${userData.email} virou Premium`, 'premiumConversion');
        // Atualiza estatísticas
        await admin.firestore()
            .doc(`users/${referrerId}/rewards/referrals`)
            .update({
            premiumConversions: admin.firestore.FieldValue.increment(1),
            'stats.totalPremium': admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Agenda verificação de retenção (30 dias)
        const retentionCheckDate = new Date();
        retentionCheckDate.setDate(retentionCheckDate.getDate() + 30);
        await admin.firestore()
            .collection('scheduledTasks')
            .add({
            type: 'check_referral_retention',
            referrerId,
            referredId: userId,
            executeAt: admin.firestore.Timestamp.fromDate(retentionCheckDate),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Envia notificação
        await sendReferralNotification(referrerId, 'premiumConversion', userData.email);
        console.log(`✅ Recompensa de conversão Premium aplicada`);
    }
    return null;
});
/**
 * Adiciona recompensa de indicação
 */
async function addReferralReward(userId, isPremium, reward, description, type) {
    if (isPremium) {
        // Premium: Adiciona créditos
        const creditsRef = admin.firestore().doc(`users/${userId}/rewards/credits`);
        await creditsRef.set({
            balance: admin.firestore.FieldValue.increment(reward.premium),
            lifetime: admin.firestore.FieldValue.increment(reward.premium),
            currency: 'BRL',
            transactions: admin.firestore.FieldValue.arrayUnion({
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: admin.firestore.FieldValue.serverTimestamp(),
                amount: reward.premium,
                source: `referral_${type}`,
                type: 'earned',
                description
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`✅ Adicionados R$ ${reward.premium} em créditos`);
    }
    else {
        // Free: Adiciona dias Premium
        const rewardsRef = admin.firestore().doc(`users/${userId}/rewards/premiumDays`);
        await rewardsRef.set({
            earned: admin.firestore.FieldValue.increment(reward.free),
            remaining: admin.firestore.FieldValue.increment(reward.free),
            history: admin.firestore.FieldValue.arrayUnion({
                date: admin.firestore.FieldValue.serverTimestamp(),
                days: reward.free,
                source: `referral_${type}`,
                type: 'earned',
                description
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`✅ Adicionados ${reward.free} dias Premium`);
    }
}
/**
 * Envia notificação de indicação
 */
async function sendReferralNotification(userId, type, referredEmail) {
    var _a;
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    const fcmToken = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken;
    if (!fcmToken)
        return;
    const messages = {
        signup: {
            title: '🎉 Novo Amigo Indicado!',
            body: `${referredEmail} se cadastrou com seu código!`
        },
        firstWeek: {
            title: '🔥 Amigo Ativo!',
            body: `${referredEmail} completou 7 dias de streak!`
        },
        premiumConversion: {
            title: '💎 Amigo Premium!',
            body: `${referredEmail} virou Premium! Você ganhou recompensa extra.`
        }
    };
    const message = {
        token: fcmToken,
        notification: messages[type],
        data: {
            type: 'referral_reward',
            screen: 'rewards'
        }
    };
    try {
        await admin.messaging().send(message);
        console.log(`✅ Notificação de indicação enviada`);
    }
    catch (error) {
        console.error('Erro ao enviar notificação:', error);
    }
}
/**
 * Envia notificação de boas-vindas para indicado
 */
async function sendWelcomeReferralNotification(userId, referrerEmail) {
    var _a;
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    const fcmToken = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken;
    if (!fcmToken)
        return;
    const message = {
        token: fcmToken,
        notification: {
            title: '🎁 Bem-vindo ao HoraMed!',
            body: `Você ganhou dias Premium grátis por usar o código de ${referrerEmail}!`
        },
        data: {
            type: 'welcome_referral',
            screen: 'rewards'
        }
    };
    try {
        await admin.messaging().send(message);
        console.log(`✅ Notificação de boas-vindas enviada`);
    }
    catch (error) {
        console.error('Erro ao enviar notificação:', error);
    }
}
//# sourceMappingURL=handleReferral.js.map