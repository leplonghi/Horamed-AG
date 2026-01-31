/**
 * Cloud Function: Aplicar Créditos na Renovação
 * 
 * Agendamento: Todo dia às 00:00
 * Ação: Verifica assinaturas renovando hoje e aplica créditos disponíveis como cupom no Stripe
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
});

export const applyCreditsToRenewal = functions.pubsub
    .schedule('every day 00:00')
    .timeZone('America/Sao_Paulo')
    .onRun(async (context) => {
        console.log('🔄 Iniciando verificação de renovações para aplicação de créditos...');

        // Data de referência (hoje)
        const today = new Date();
        // Data limite (próximos 24h)
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const db = admin.firestore();

        // Busca assinaturas que renovam nas próximas 24h
        // Nota: Idealmente, teríamos um índice para isso
        const subscriptionsSnapshot = await db
            .collectionGroup('subscription')
            .where('currentPeriodEnd', '>=', today)
            .where('currentPeriodEnd', '<', tomorrow)
            .where('status', '==', 'active')
            .get();

        if (subscriptionsSnapshot.empty) {
            console.log('Nenhuma renovação encontrada para hoje.');
            return null;
        }

        console.log(`${subscriptionsSnapshot.size} renovações encontradas.`);

        const updates = [];

        for (const doc of subscriptionsSnapshot.docs) {
            const subscription = doc.data();
            // O documento subscription está em users/{userId}/subscription/details
            // Ou users/{userId} com campo subscription. Depende da estrutura escolhida.
            // Assumindo subcoleção: users/{userId}/subscription/{subId} -> parent.parent.id
            // Se for campo no user, a query seria diferente.
            // Vou assumir estrutura users/{userId}/subscription/stripe (padrão)

            const userId = doc.ref.parent.parent?.id;
            if (!userId) continue;

            // Busca saldo de créditos do usuário
            const creditsDoc = await db.doc(`users/${userId}/rewards/credits`).get();
            const creditsBalance = creditsDoc.data()?.balance || 0;

            if (creditsBalance <= 0) {
                console.log(`Usuário ${userId} não tem créditos.`);
                continue;
            }

            if (!subscription.stripeSubscriptionId) {
                console.warn(`Assinatura ${doc.id} sem stripeSubscriptionId.`);
                continue;
            }

            updates.push(processRenewal(userId, subscription.stripeSubscriptionId, creditsBalance));
        }

        await Promise.all(updates);
        console.log('✅ Processamento de créditos concluído.');
        return null;
    });

async function processRenewal(userId: string, subscriptionId: string, credits: number) {
    try {
        // 1. Busca assinatura no Stripe para saber o valor
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);

        if (!stripeSub.items.data[0]) {
            console.error(`Assinatura ${subscriptionId} sem itens.`);
            return;
        }

        const price = stripeSub.items.data[0].price.unit_amount || 0;
        const priceValue = price / 100; // Centavos para Reais

        // 2. Calcula desconto (não pode ser maior que o valor da assinatura)
        const discountAmount = Math.min(credits, priceValue);

        if (discountAmount <= 0) return;

        console.log(`Aplicando R$ ${discountAmount} de desconto para ${userId} (Saldo: R$ ${credits})`);

        // 3. Cria um cupom de uso único no Stripe
        const coupon = await stripe.coupons.create({
            amount_off: Math.round(discountAmount * 100), // Centavos
            currency: 'brl',
            duration: 'once',
            name: `Créditos HoraMed (R$ ${discountAmount.toFixed(2)})`,
            metadata: {
                userId,
                source: 'rewards_credits'
            }
        });

        // 4. Aplica o cupom na assinatura
        await stripe.subscriptions.update(subscriptionId, {
            coupon: coupon.id,
            metadata: {
                lastCreditDetails: `R$ ${discountAmount.toFixed(2)} applied on ${new Date().toISOString()}`
            }
        } as any);

        // 5. Deduz os créditos do saldo do usuário
        const db = admin.firestore();
        const creditsRef = db.doc(`users/${userId}/rewards/credits`);

        await creditsRef.update({
            balance: admin.firestore.FieldValue.increment(-discountAmount),
            transactions: admin.firestore.FieldValue.arrayUnion({
                id: `renewal_${Date.now()}`,
                date: new Date(),
                amount: -discountAmount,
                source: 'renewal_discount',
                type: 'spent',
                description: 'Desconto aplicado na renovação automática',
                metadata: {
                    subscriptionId,
                    originalPrice: priceValue,
                    discount: discountAmount
                }
            })
        });

        // 6. Notifica o usuário
        await sendCreditNotification(userId, discountAmount);

    } catch (error) {
        console.error(`Erro ao processar renovação para ${userId}:`, error);
    }
}

async function sendCreditNotification(userId: string, amount: number) {
    const db = admin.firestore();
    const userDoc = await db.doc(`users/${userId}`).get();
    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) return;

    const message = {
        token: fcmToken,
        notification: {
            title: '💰 Desconto Aplicado!',
            body: `Usamos R$ ${amount.toFixed(2)} dos seus créditos na renovação da sua assinatura.`,
        },
        data: {
            type: 'credit_applied',
            amount: amount.toString()
        }
    };

    try {
        await admin.messaging().send(message);
    } catch (e) {
        console.error('Erro ao enviar notificação', e);
    }
}
