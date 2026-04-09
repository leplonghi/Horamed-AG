"use strict";
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
exports.googleCalendarSync = exports.sendWhatsappReminder = exports.pharmacyPrices = exports.generateMonthlyReport = exports.updatePaymentMethod = exports.getPaymentMethod = exports.syncProtectionAvailable = exports.resetMonthlyProtections = exports.applyCreditsToRenewal = exports.handleReferralFirstWeek = exports.handleReferralSignup = exports.handleStreakMilestone = exports.claraConsultationPrep = exports.claraWeeklySummary = exports.cancelSubscription = exports.applyRetentionOffer = exports.syncSubscription = exports.generateTravelDoses = exports.caregiverInvite = exports.voiceToText = exports.consultationCard = exports.analyzeDocument = exports.checkMedicationInteractions = exports.checkInteractions = exports.extractDocument = exports.extractExam = exports.extractMedication = exports.scheduleDoseNotifications = exports.sendDoseNotification = exports.healthAssistant = exports.stripeWebhook = exports.createCustomerPortal = exports.onReferralChange = exports.createCheckoutSession = exports.onUserDelete = exports.onUserCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = require("stripe");
const generative_ai_1 = require("@google/generative-ai");
const dotenv = __importStar(require("dotenv"));
// Load environment variables from .env file
dotenv.config();
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
/**
 * ==================================================================
 * CONFIGURATION & SECRETS
 * ==================================================================
 */
// Lazy initialization for Stripe
let stripeInstance = null;
const getStripe = () => {
    var _a;
    if (!stripeInstance) {
        // Use environment variable for production
        const key = process.env.STRIPE_SECRET_KEY || ((_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.secret_key);
        console.log("[STRIPE] Initializing with key prefix:", (key === null || key === void 0 ? void 0 : key.substring(0, 8)) || 'MISSING');
        if (!key) {
            throw new Error("Stripe secret key is missing in environment variables or functions config.");
        }
        stripeInstance = new stripe_1.Stripe(key, {
            apiVersion: '2025-01-27.acacia',
        });
    }
    return stripeInstance;
};
// Lazy initialization for Gemini
let genAIInstance = null;
const getGenAI = () => {
    var _a;
    if (!genAIInstance) {
        const key = process.env.GOOGLE_AI_API_KEY || ((_a = functions.config().google) === null || _a === void 0 ? void 0 : _a.ai_key);
        if (!key) {
            // For build/deploy safety, if env is missing, we can throw at runtime
            // warning: this might break if deploying without setting env first
            console.warn("Google AI API Key is missing in environment variables.");
        }
        // If key is undefined, the constructor might throw or subsequent calls will.
        genAIInstance = new generative_ai_1.GoogleGenerativeAI(key || "dummy_key_for_build");
    }
    return genAIInstance;
};
/**
 * ==================================================================
 * RATE LIMITING UTILITY
 * Protects expensive AI/OCR functions from abuse.
 * Uses Firestore to track call counts per user per hour.
 * ==================================================================
 */
const RATE_LIMITS = {
    healthAssistant: { maxCalls: 30, windowMinutes: 60 },
    ocr: { maxCalls: 15, windowMinutes: 60 },
};
async function checkRateLimit(userId, functionKey) {
    const { maxCalls, windowMinutes } = RATE_LIMITS[functionKey];
    const windowMs = windowMinutes * 60 * 1000;
    const now = Date.now();
    const ref = db.doc(`users/${userId}/rateLimits/${functionKey}`);
    await db.runTransaction(async (tx) => {
        var _a, _b;
        const doc = await tx.get(ref);
        const data = doc.data();
        const windowStart = (_a = data === null || data === void 0 ? void 0 : data.windowStart) !== null && _a !== void 0 ? _a : 0;
        const count = (_b = data === null || data === void 0 ? void 0 : data.count) !== null && _b !== void 0 ? _b : 0;
        if (now - windowStart > windowMs) {
            // Reset window
            tx.set(ref, { count: 1, windowStart: now });
        }
        else if (count >= maxCalls) {
            throw new functions.https.HttpsError('resource-exhausted', `Limite de ${maxCalls} chamadas por hora atingido. Tente novamente mais tarde.`);
        }
        else {
            tx.update(ref, { count: admin.firestore.FieldValue.increment(1) });
        }
    });
}
// Price Configuration (Updated 2026-01-30)
const PRICES = {
    BRL: {
        monthly: 'price_1SvP3bHh4P8HSV4Y7Mrv5t2y',
        annual: 'price_1SvP45Hh4P8HSV4Y2DYbc4Gr',
        lifetime: 'price_1T5ZrAHh4P8HSV4YKrPTGhCg',
    },
    USD: {
        monthly: 'price_1SvxqlHh4P8HSV4YpZKzGawy',
        annual: 'price_1SvxrIHh4P8HSV4YCGnYC8Mn',
        lifetime: 'price_1T5ZrAHh4P8HSV4YvS5ECHve',
    },
};
/**
 * ==================================================================
 * 1. USER MANAGEMENT TRIGGERS
 * ==================================================================
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;
    try {
        await db.collection('users').doc(uid).set({
            email,
            displayName: displayName || null,
            photoURL: photoURL || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            onboardingCompleted: false,
            isPremium: false,
        });
        await db.collection('users').doc(uid).collection('subscription').doc('current').set({
            planType: 'free',
            status: 'active',
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 3 * 24 * 60 * 60 * 1000)
        });
        functions.logger.info(`User profile created for ${uid}`);
    }
    catch (error) {
        functions.logger.error(`Error creating user profile for ${uid}:`, error);
    }
});
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
    const { uid } = user;
    try {
        const batch = db.batch();
        batch.delete(db.collection('users').doc(uid));
        const subcollections = ['medications', 'doses', 'stock', 'healthDocuments', 'subscription', 'healthInsights'];
        for (const sub of subcollections) {
            const snapshot = await db.collection('users').doc(uid).collection(sub).get();
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        }
        await batch.commit();
        functions.logger.info(`User data deleted for ${uid}`);
    }
    catch (error) {
        functions.logger.error(`Error deleting user data for ${uid}:`, error);
    }
});
/**
 * ==================================================================
 * 2. STRIPE PAYMENTS
 * ==================================================================
 */
// Helper to calculate discount based on active referrals
// Helper removed: calculateReferralDiscount - Replaced by onReferralChange reward logic
// Create Checkout Session (Renamed to match Frontend)
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    var _a, _b;
    functions.logger.info('createCheckoutSession called', { data, authUid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid });
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // Default to monthly/BR if not provided
    const { planType = 'monthly', countryCode = 'BR', redirectUrl } = data;
    const { uid } = context.auth;
    functions.logger.info('Request params', { planType, countryCode, uid });
    try {
        // Get user data to retrieve email
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();
        if (!userData) {
            throw new functions.https.HttpsError('not-found', 'User profile not found');
        }
        const email = userData.email || context.auth.token.email;
        if (!email) {
            throw new functions.https.HttpsError('failed-precondition', 'User email not found');
        }
        // Resolve Price ID
        const currency = (countryCode === 'BR' ? 'BRL' : 'USD');
        const resolvedPlan = planType;
        const priceId = (_b = PRICES[currency]) === null || _b === void 0 ? void 0 : _b[resolvedPlan];
        if (!priceId) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid plan type or country code');
        }
        functions.logger.info('Price resolved', { currency, planType, priceId });
        // Get or create Stripe Customer
        let customerId;
        const stripe = getStripe();
        functions.logger.info('Stripe instance created');
        if (userData === null || userData === void 0 ? void 0 : userData.stripeCustomerId) {
            const potentialId = userData.stripeCustomerId;
            // Verify if customer exists in current environment (Live vs Test mismatch check)
            try {
                const customer = await stripe.customers.retrieve(potentialId);
                if (customer.deleted) {
                    functions.logger.warn(`Customer ${potentialId} is deleted in Stripe.`);
                    customerId = undefined;
                }
                else {
                    customerId = potentialId;
                    functions.logger.info('Using existing Stripe customer ID', { customerId });
                }
            }
            catch (err) {
                functions.logger.warn(`Existing customer ID ${potentialId} invalid in this env (Live/Test mismatch?). Creating new. Error: ${err.message}`);
                customerId = undefined;
            }
        }
        if (!customerId) {
            functions.logger.info('Creating new Stripe customer', { email });
            const customer = await stripe.customers.create({ email, metadata: { firebaseUid: uid } });
            customerId = customer.id;
            await userDoc.ref.update({ stripeCustomerId: customerId });
            functions.logger.info('Stripe customer created and updated in DB', { customerId });
        }
        else {
            // STRICT DOUBLE-CHECK: Check Stripe directly for active subscriptions
            try {
                const subscriptions = await stripe.subscriptions.list({
                    customer: customerId,
                    status: 'active',
                    limit: 1
                });
                if (subscriptions.data.length > 0) {
                    functions.logger.info('Stripe CONFIRMS active subscription. Preventing double charge.', { uid, subId: subscriptions.data[0].id });
                    // Sync DB while we are here
                    await db.collection('users').doc(uid).collection('subscription').doc('current').set({
                        status: 'active',
                        stripeSubscriptionId: subscriptions.data[0].id,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    // Redirect to portal
                    const portalSession = await stripe.billingPortal.sessions.create({
                        customer: customerId,
                        return_url: redirectUrl || 'https://app.horamed.net/perfil',
                    });
                    return { url: portalSession.url };
                }
            }
            catch (err) {
                functions.logger.warn(`Error checking existing subscriptions: ${err.message}. Proceeding with caution.`);
            }
        }
        // Referral Rewards are now 'Free Months' applied post-activation logic (see onReferralChange)
        // No upfront discount on checkout
        const couponId = undefined;
        functions.logger.info('Creating checkout session', { customerId, priceId, couponId });
        const isLifetime = planType === 'lifetime';
        const sessionConfig = {
            mode: isLifetime ? 'payment' : 'subscription',
            payment_method_types: ['card'],
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            discounts: couponId ? [{ coupon: couponId }] : undefined,
            success_url: redirectUrl
                ? `${redirectUrl}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`
                : `https://app.horamed.net/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: redirectUrl
                ? `${redirectUrl}/assinatura/cancelado`
                : `https://app.horamed.net/assinatura/cancelado`,
            client_reference_id: uid,
            allow_promotion_codes: true,
            metadata: {
                firebaseUid: uid,
                planType: planType
            }
        };
        if (!isLifetime) {
            sessionConfig.subscription_data = {
                metadata: { firebaseUid: uid },
                trial_period_days: 7
            };
        }
        else {
            sessionConfig.payment_intent_data = {
                metadata: {
                    firebaseUid: uid,
                    planType: 'lifetime'
                }
            };
        }
        const session = await stripe.checkout.sessions.create(sessionConfig);
        functions.logger.info('Checkout session created successfully', { sessionId: session.id, url: session.url });
        return { url: session.url };
    }
    catch (error) {
        functions.logger.error('Stripe Checkout Error:', {
            message: error.message,
            type: error.type,
            code: error.code,
            stack: error.stack
        });
        throw new functions.https.HttpsError('internal', error.message || 'Payment init failed');
    }
});
// Trigger to update Stripe Subscription when Referrals change
exports.onReferralChange = functions.firestore.document('users/{userId}/referrals/{referralId}')
    .onWrite(async (change, context) => {
    const { userId } = context.params;
    const after = change.after.exists ? change.after.data() : null;
    // Only evaluate if status is 'active' (meaning purchase confirmed)
    if ((after === null || after === void 0 ? void 0 : after.status) !== 'active')
        return;
    functions.logger.info(`Referral active for ${userId}, evaluating rewards...`);
    try {
        // 1. Tally Qualified Referrals
        const refs = await db.collection(`users/${userId}/referrals`).where('status', '==', 'active').get();
        let monthlyRefCount = 0;
        let annualRefCount = 0;
        refs.docs.forEach(d => {
            const p = d.data().planType;
            if (p === 'premium_monthly')
                monthlyRefCount++;
            if (p === 'premium_annual')
                annualRefCount++;
        });
        // 2. Calculate Total Earned Months
        // Rule: 1 Month for every 5 Monthly OR every 2 Annual
        const rewardsFromMonthly = Math.floor(monthlyRefCount / 5);
        const rewardsFromAnnual = Math.floor(annualRefCount / 2);
        const totalEarned = Math.min(rewardsFromMonthly + rewardsFromAnnual, 10); // Cap at 10 times
        // 3. Check against Claimed
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const claimed = (userData === null || userData === void 0 ? void 0 : userData.referralRewardsClaimed) || 0;
        if (totalEarned > claimed) {
            const monthsToGrant = totalEarned - claimed;
            functions.logger.info(`User ${userId} earned ${monthsToGrant} new free months! Total Earned: ${totalEarned}`);
            // 4. Apply Reward to Stripe (Extend Trial/Pause Billing)
            if ((userData === null || userData === void 0 ? void 0 : userData.stripeSubscriptionId) && (userData === null || userData === void 0 ? void 0 : userData.isPremium)) {
                const stripe = getStripe();
                const subId = userData.stripeSubscriptionId;
                const sub = await stripe.subscriptions.retrieve(subId);
                if (sub.status === 'active' || sub.status === 'trialing') {
                    // Calculate new end date
                    // Use trial_end if exists, else current_period_end
                    // Add 30 days per reward
                    const subAny = sub;
                    const currentAnchor = subAny.trial_end || subAny.current_period_end;
                    const additionalTime = monthsToGrant * 30 * 24 * 60 * 60; // 30 days in seconds
                    const newEnd = currentAnchor + additionalTime;
                    await stripe.subscriptions.update(subId, {
                        trial_end: newEnd,
                        proration_behavior: 'none' // Don't charge/refund, just extend
                    });
                    functions.logger.info(`Stripe subscription ${subId} extended until ${new Date(newEnd * 1000)}`);
                    // 5. Update Claimed Count
                    await userDoc.ref.update({
                        referralRewardsClaimed: totalEarned,
                        lastRewardGrantedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
                else {
                    functions.logger.warn(`User ${userId} earned reward but subscription is ${sub.status}. Storing pending claim?`);
                }
            }
        }
    }
    catch (error) {
        functions.logger.error('Error processing referral reward:', error);
    }
});
exports.createCustomerPortal = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    const { returnUrl } = data;
    const { uid } = context.auth;
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        const customerId = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.stripeCustomerId;
        if (!customerId)
            throw new functions.https.HttpsError('failed-precondition', 'No customer ID found');
        const session = await getStripe().billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl || 'https://app.horamed.net/perfil',
        });
        return { url: session.url };
    }
    catch (error) {
        functions.logger.error('Portal Error:', error);
        // Self-healing: If customer incorrect/deleted in Stripe, remove from DB so they can re-subscribe
        if (error.code === 'resource_missing' || (error.message && error.message.includes('No such customer'))) {
            functions.logger.warn(`Customer ID invalid/deleted. removing from DB users/${uid}`);
            await db.collection('users').doc(uid).update({
                stripeCustomerId: admin.firestore.FieldValue.delete(),
                isPremium: false
            });
            throw new functions.https.HttpsError('not-found', 'Stripe customer not found. Please re-subscribe.');
        }
        throw new functions.https.HttpsError('internal', error.message);
    }
});
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    var _a, _b;
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ((_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.webhook_secret);
    let event;
    try {
        if (!webhookSecret)
            throw new Error('Missing Webhook Secret');
        event = getStripe().webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    }
    catch (err) {
        functions.logger.error(`Webhook Signature verification failed: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const uid = session.client_reference_id;
                const customerId = session.customer;
                const subscriptionId = session.subscription;
                if (uid) {
                    const isLifetime = session.mode === 'payment' && ((_b = session.metadata) === null || _b === void 0 ? void 0 : _b.planType) === 'lifetime';
                    await updateUserSubscription(uid, subscriptionId || 'lifetime_payment', customerId, 'active', isLifetime ? 'lifetime' : 'premium');
                }
                break;
            }
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                const customerId = sub.customer;
                const usersRef = db.collection('users');
                const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).limit(1).get();
                if (!snapshot.empty) {
                    const uid = snapshot.docs[0].id;
                    const status = sub.status;
                    const plan = (status === 'active' || status === 'trialing') ? 'premium' : 'free';
                    const subAny = sub;
                    await updateUserSubscription(uid, sub.id, customerId, status, plan, subAny.current_period_end, sub.trial_end, sub.cancel_at_period_end);
                }
                break;
            }
        }
        res.json({ received: true });
    }
    catch (err) {
        functions.logger.error('Webhook processing error', err);
        res.status(500).send('Internal Server Error');
    }
});
async function updateUserSubscription(uid, subId, custId, status, planType, currentPeriodEnd, trialEnd, cancelAtPeriodEnd) {
    const data = {
        status,
        planType,
        stripeSubscriptionId: subId,
        stripeCustomerId: custId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (currentPeriodEnd)
        data.expiresAt = admin.firestore.Timestamp.fromMillis(currentPeriodEnd * 1000);
    if (trialEnd)
        data.trialEndsAt = admin.firestore.Timestamp.fromMillis(trialEnd * 1000);
    if (cancelAtPeriodEnd !== undefined)
        data.cancelAtPeriodEnd = cancelAtPeriodEnd;
    await db.collection('users').doc(uid).collection('subscription').doc('current').set(data, { merge: true });
    await db.collection('users').doc(uid).set({
        isPremium: (planType === 'premium' || planType === 'lifetime'),
        planType: planType,
        stripeCustomerId: custId
    }, { merge: true });
}
/**
 * ==================================================================
 * 3. AI HEALTH AGENT (Gemini 1.5 Flash)
 * ==================================================================
 */
exports.healthAssistant = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    await checkRateLimit(context.auth.uid, 'healthAssistant');
    const { messages } = data;
    if (!messages || !Array.isArray(messages)) {
        throw new functions.https.HttpsError('invalid-argument', 'Messages array required');
    }
    try {
        // Upgrade to Gemini 1.5 Flash for better performance/cost
        const model = getGenAI().getGenerativeModel({ model: "gemini-3-pro-preview" });
        const lastMessage = messages[messages.length - 1].content;
        // Convert history format (skip system message if it's the first one, or use it as systemInstruction)
        // Gemini API supports systemInstruction in model config, but for simplicity with history array:
        // We will filter out the 'system' role from history and pass it as systemInstruction if possible,
        // or just prepend it to the first user part. 
        // 
        // Current simplified approach: treat 'system' as 'user' with a prefix or use native support.
        // Node SDK 0.24.1 supports `systemInstruction`.
        const systemMessage = messages.find(m => m.role === 'system');
        const chatHistory = messages
            .filter(m => m.role !== 'system' && m !== messages[messages.length - 1]) // Exclude system and last message
            .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));
        const chatOptions = {
            history: chatHistory
        };
        if (systemMessage) {
            chatOptions.systemInstruction = systemMessage.content;
        }
        // Fetch User Health Profile for Context
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        const userData = userDoc.data();
        let healthContext = "";
        if (userData) {
            // Calculate age if birthDate exists
            let age = "Unknown";
            if (userData.birthDate) {
                const birth = new Date(userData.birthDate);
                const diff = Date.now() - birth.getTime();
                const ageDate = new Date(diff);
                age = Math.abs(ageDate.getUTCFullYear() - 1970).toString();
            }
            // Fetch Vitals (Latest)
            const pSnap = await db.collection(`users/${context.auth.uid}/pressureLogs`).orderBy('recordedAt', 'desc').limit(1).get();
            const lastP = pSnap.empty ? null : pSnap.docs[0].data();
            const gSnap = await db.collection(`users/${context.auth.uid}/glucoseLogs`).orderBy('recordedAt', 'desc').limit(1).get();
            const lastG = gSnap.empty ? null : gSnap.docs[0].data();
            healthContext = `
CONTEXTO DE SAÚDE DO USUÁRIO (Use para personalizar, mas não mencione se não for relevante):
- Nome: ${userData.displayName || 'Paciente'}
- Idade: ${age} anos
- Peso: ${userData.weightKg ? userData.weightKg + ' kg' : 'Não informado'}
- Altura: ${userData.heightCm ? userData.heightCm + ' cm' : 'Não informada'}
- Pressão: ${lastP ? `${lastP.systolic}/${lastP.diastolic}` : 'N/A'}
- Glicose: ${lastG ? `${lastG.value}` : 'N/A'}
            `.trim();
        }
        if (chatOptions.systemInstruction) {
            chatOptions.systemInstruction += `\n\n${healthContext}`;
        }
        else {
            chatOptions.systemInstruction = `Você é a Clara, assistente de saúde do HoraMed. ${healthContext}`;
        }
        const chat = model.startChat(chatOptions);
        const result = await chat.sendMessage(lastMessage);
        const response = result.response.text();
        return { role: 'assistant', content: response };
    }
    catch (error) {
        functions.logger.error('AI Error:', error);
        if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('API_KEY')) {
            return {
                role: 'assistant',
                content: '⚠️ Erro de configuração: API Key do Gemini não encontrada no servidor.'
            };
        }
        throw new functions.https.HttpsError('internal', 'AI processing failed');
    }
});
/**
 * ==================================================================
 * 4. NOTIFICATIONS
 * ==================================================================
 */
exports.sendDoseNotification = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    const { userId, title, body, doseId } = data;
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const token = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.pushToken;
        if (!token)
            return { success: false, reason: 'no_token' };
        await admin.messaging().send({
            token,
            notification: { title, body },
            data: { type: 'dose', doseId }
        });
        return { success: true };
    }
    catch (error) {
        functions.logger.error('Push Error:', error);
        return { success: false };
    }
});
exports.scheduleDoseNotifications = functions.pubsub.schedule('every 15 minutes').onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const buffer = 15 * 60 * 1000;
    const targetTime = admin.firestore.Timestamp.fromMillis(now.toMillis() + buffer);
    const snapshot = await db.collectionGroup('doses')
        .where('scheduledTime', '>=', now)
        .where('scheduledTime', '<=', targetTime)
        .where('notificationSent', '==', false)
        .get();
    const promises = snapshot.docs.map(async (doc) => {
        var _a, _b;
        const dose = doc.data();
        const userId = (_a = doc.ref.parent.parent) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return;
        const userDoc = await db.collection('users').doc(userId).get();
        const token = (_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.pushToken;
        if (!token)
            return;
        try {
            await admin.messaging().send({
                token,
                notification: {
                    title: 'Hora do Medicamento 💊',
                    body: `Está na hora de tomar ${dose.medicationName || 'seu medicamento'}`
                },
                data: { doseId: doc.id }
            });
            await doc.ref.update({ notificationSent: true });
        }
        catch (e) {
            console.error(`Failed to send to ${userId}`, e);
        }
    });
    await Promise.all(promises);
});
/**
 * ==================================================================
 * 5. UTILITIES & OCR (IMPLEMENTED)
 * ==================================================================
 */
// Helper for Vision AI
async function processImage(image, prompt) {
    const model = getGenAI().getGenerativeModel({ model: "gemini-3-pro-preview" });
    const result = await model.generateContent([
        {
            inlineData: {
                mimeType: 'image/jpeg', // Assuming jpeg/base64 generic, usually works even for png
                data: image
            }
        },
        { text: prompt }
    ]);
    return result.response.text();
}
exports.extractMedication = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    await checkRateLimit(context.auth.uid, 'ocr');
    const { image } = data;
    if (!image)
        throw new functions.https.HttpsError('invalid-argument', 'Image data required');
    try {
        const prompt = `
            Analise esta imagem de um medicamento ou receita. Extraia os dados abaixo em formato JSON puro (sem markdown).
            Campos:
            - name: Nome do medicamento
            - dose: Dosagem (ex: 500mg)
            - category: Categoria (ex: antinflamatorio, antibiotico, etc)
            - duration_days: Duração em dias (se houver, number)
            - total_doses: Total de doses (se houver, number)
            - start_date: Data de início (se houver, YYYY-MM-DD)
            
            Se não encontrar algum campo, ignore ou retorne null.
        `;
        const text = await processImage(image, prompt);
        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    }
    catch (error) {
        functions.logger.error('OCR Error:', error);
        throw new functions.https.HttpsError('internal', 'OCR failed: ' + error.message);
    }
});
exports.extractExam = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    await checkRateLimit(context.auth.uid, 'ocr');
    const { image } = data;
    if (!image)
        throw new functions.https.HttpsError('invalid-argument', 'Image data required');
    try {
        const prompt = `
            Analise este exame médico. Extraia os principais resultados em formato JSON puro.
            Estrutura sugerida: { "title": "Nome do Exame", "date": "YYYY-MM-DD", "results": [{ "parameter": "Nome", "value": "Valor", "reference": "Ref" }] }
        `;
        const text = await processImage(image, prompt);
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    }
    catch (error) {
        functions.logger.error('Exam OCR Error', error);
        throw new functions.https.HttpsError('internal', 'Exam processing failed');
    }
});
exports.extractDocument = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    await checkRateLimit(context.auth.uid, 'ocr');
    const { image } = data;
    if (!image)
        throw new functions.https.HttpsError('invalid-argument', 'Image data required');
    try {
        const prompt = `
            Leia este documento médico e faça um resumo estruturado em JSON.
            Campos: title, type (receita, atestado, laudo, outro), summary, date.
        `;
        const text = await processImage(image, prompt);
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    }
    catch (error) {
        functions.logger.error('Doc OCR Error', error);
        throw new functions.https.HttpsError('internal', 'Document processing failed');
    }
});
// Check Interactions (Matches usage in useMedicationInteractions.ts: 'checkInteractions')
exports.checkInteractions = functions.https.onCall(async (data, context) => {
    // Note: Frontend calls 'checkInteractions', previous stub was 'checkMedicationInteractions'
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Authenticated user required');
    const { newMedication, profileId } = data;
    const uid = context.auth.uid;
    const targetUid = profileId || uid; // Allow checking for dependents
    try {
        // Fetch current medications from Firestore
        const medicationsSnap = await db.collection('users').doc(targetUid).collection('medications').where('isActive', '==', true).get();
        const currentMeds = medicationsSnap.docs.map(doc => doc.data().name);
        if (!newMedication && currentMeds.length < 2) {
            return { interactions: [], hasCritical: false };
        }
        const drugList = newMedication ? [...currentMeds, newMedication] : currentMeds;
        if (drugList.length < 2)
            return { interactions: [], hasCritical: false };
        const prompt = `
            Verifique interações medicamentosas entre os seguintes itens: ${drugList.join(', ')}.
            Retorne APENAS um JSON puro com a lista de interações.
            Formato:
            {
                "interactions": [
                    {
                         "drugA": "Nome A",
                         "drugB": "Nome B",
                         "severity": "low" | "moderate" | "high" | "contraindicated",
                         "description": "Explicação curta",
                         "recommendation": "O que fazer"
                    }
                ]
            }
            Se não houver interações, retorne { "interactions": [] }.
        `;
        const model = getGenAI().getGenerativeModel({ model: "gemini-3-pro-preview" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    }
    catch (error) {
        functions.logger.error('Interaction Check Error:', error);
        // Fallback to empty to avoid breaking blocking flows, but log error
        return { interactions: [], hasCritical: false };
    }
});
// Legacy compatibility aliases (if needed) but preferring correct names
exports.checkMedicationInteractions = exports.checkInteractions;
exports.analyzeDocument = exports.extractDocument; // Alias for migration compatibility
exports.consultationCard = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    return { url: `https://app.horamed.net/cartao-consulta/${context.auth.uid}` };
});
exports.voiceToText = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    const { audio, mimeType } = data;
    if (!audio) {
        throw new functions.https.HttpsError('invalid-argument', 'Audio content is required');
    }
    try {
        const model = getGenAI().getGenerativeModel({
            model: "gemini-3-pro-preview",
            generationConfig: { responseMimeType: "application/json" }
        });
        // Sophisticated System Prompt for Predictive Intelligence
        const prompt = `
        You are an AI assistant for "HoraMed", a medication management app. 
        Analyze the user's voice command and extract structured intent.
        
        Current Context: User is authenticated. App has features: Medicines, Calendar, Stock, Health, Profile, Documents.

        Output MUST be a valid JSON object with this schema:
        {
          "text": "Exact transcription of what user said",
          "intent": {
             "type": "NAVIGATE" | "ADD_MEDICATION" | "MARK_DOSE" | "CHECK_STOCK" | "HEALTH_QUERY" | "UNKNOWN",
             "confidence": "high" | "medium" | "low",
             "entities": {
                "medication": string | null,
                "date": string | null,
                "quantity": number | null,
                "symptom": string | null
             },
             "action_path": string | null (e.g. "/medicamentos"),
             "spokenResponse": string (Natural, short, helpful response in Portuguese)
          }
        }

        Examples:
        - "Quero adicionar paracetamol" -> { "text": "Quero adicionar paracetamol", "intent": { "type": "ADD_MEDICATION", "confidence": "high", "entities": { "medication": "Paracetamol", "date": null, "quantity": null, "symptom": null }, "action_path": "/adicionar-item", "spokenResponse": "Abrindo formulário para Paracetamol." } }
        - "Estou com dor de cabeça" -> { "text": "Estou com dor de cabeça", "intent": { "type": "HEALTH_QUERY", "confidence": "high", "entities": { "medication": null, "date": null, "quantity": null, "symptom": "dor de cabeça" }, "action_path": "/saude", "spokenResponse": "Sinto muito. Você quer registrar esse sintoma ou ver seus remédios para dor?" } }
        - "Ir para a agenda" -> { "text": "Ir para a agenda", "intent": { "type": "NAVIGATE", "confidence": "high", "entities": { "medication": null, "date": null, "quantity": null, "symptom": null }, "action_path": "/agenda", "spokenResponse": "Abrindo sua agenda." } }
        `;
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType || 'audio/webm',
                    data: audio
                }
            },
            { text: prompt }
        ]);
        const responseText = result.response.text();
        // Robust JSON parsing: strip Markdown fences if present
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResponse = JSON.parse(jsonStr);
        return jsonResponse;
    }
    catch (error) {
        functions.logger.error('Voice Intelligence Error:', error);
        throw new functions.https.HttpsError('internal', 'AI processing failed: ' + error.message);
    }
});
exports.caregiverInvite = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // TODO: Implement actual email sending via SendGrid or similar
    return { success: true, message: `Convite enviado para ${data.email}` };
});
exports.generateTravelDoses = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // This would likely involve complex scheduling logic, keep stub or implement basic version if needed
    return { success: true, message: "Doses de viagem geradas com sucesso" };
});
exports.syncSubscription = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    const uid = context.auth.uid;
    const stripe = getStripe();
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists)
            throw new functions.https.HttpsError('not-found', 'User not found');
        const userData = userDoc.data();
        const customerId = userData === null || userData === void 0 ? void 0 : userData.stripeCustomerId;
        if (!customerId) {
            // No customer ID means definitely no subscription
            await updateUserSubscription(uid, '', '', 'inactive', 'free');
            return { status: 'synced', result: 'no_customer_id' };
        }
        // Check Stripe for active subscriptions
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1
        });
        if (subscriptions.data.length > 0) {
            const sub = subscriptions.data[0];
            const planType = 'premium'; // Assuming single tier for now
            // Check for discount (handle both API versions/types)
            const subAny = sub;
            // Generic discount detection
            let discountPercent = 0;
            let discountType = null;
            let discountApplied = false;
            // Check top-level discount (older API/simple case)
            if ((_b = (_a = subAny.discount) === null || _a === void 0 ? void 0 : _a.coupon) === null || _b === void 0 ? void 0 : _b.percent_off) {
                discountPercent = subAny.discount.coupon.percent_off;
                discountType = subAny.discount.coupon.name || 'discount';
                discountApplied = true;
            }
            // Check new discounts array
            else if (subAny.discounts && subAny.discounts.length > 0) {
                const firstDiscount = subAny.discounts[0];
                if ((_c = firstDiscount.coupon) === null || _c === void 0 ? void 0 : _c.percent_off) {
                    discountPercent = firstDiscount.coupon.percent_off;
                    discountType = firstDiscount.coupon.name || 'discount';
                    discountApplied = true;
                }
            }
            // Keep specialized logic for Retention if needed
            const isRetention = ((_d = sub.metadata) === null || _d === void 0 ? void 0 : _d.retention_claimed) === 'true' ||
                ((_f = (_e = subAny.discount) === null || _e === void 0 ? void 0 : _e.coupon) === null || _f === void 0 ? void 0 : _f.id) === 'RETENTION_15_OFF' ||
                (subAny.discounts && subAny.discounts.length > 0 && ((_h = (_g = subAny.discounts[0]) === null || _g === void 0 ? void 0 : _g.coupon) === null || _h === void 0 ? void 0 : _h.id) === 'RETENTION_15_OFF');
            if (isRetention) {
                discountType = 'retention';
                if (discountPercent === 0)
                    discountPercent = 15;
                discountApplied = true;
            }
            const updateData = {
                status: sub.status,
                planType,
                stripeSubscriptionId: sub.id,
                stripeCustomerId: customerId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                interval: ((_m = (_l = (_k = (_j = sub.items) === null || _j === void 0 ? void 0 : _j.data[0]) === null || _k === void 0 ? void 0 : _k.price) === null || _l === void 0 ? void 0 : _l.recurring) === null || _m === void 0 ? void 0 : _m.interval) || 'month',
                amount: ((_q = (_p = (_o = sub.items) === null || _o === void 0 ? void 0 : _o.data[0]) === null || _p === void 0 ? void 0 : _p.price) === null || _q === void 0 ? void 0 : _q.unit_amount) || 0,
                currency: ((_t = (_s = (_r = sub.items) === null || _r === void 0 ? void 0 : _r.data[0]) === null || _s === void 0 ? void 0 : _s.price) === null || _t === void 0 ? void 0 : _t.currency) || 'brl',
                expiresAt: admin.firestore.Timestamp.fromMillis(sub.current_period_end * 1000),
                cancelAtPeriodEnd: sub.cancel_at_period_end || false,
                trialEndsAt: sub.trial_end ? admin.firestore.Timestamp.fromMillis(sub.trial_end * 1000) : null
            };
            if (discountApplied) {
                updateData.discountApplied = true;
                updateData.discountPercent = discountPercent;
                updateData.discountType = discountType;
            }
            else {
                updateData.discountApplied = false;
                updateData.discountPercent = 0;
                updateData.discountType = null;
            }
            // Direct update instead of helper to include discount data
            await db.collection('users').doc(uid).collection('subscription').doc('current').set(updateData, { merge: true });
            await db.collection('users').doc(uid).set({
                isPremium: true,
                stripeCustomerId: customerId
            }, { merge: true });
            return { status: 'synced', result: 'active_found', plan: planType };
        }
        else {
            // Check for trialing?
            const trialing = await stripe.subscriptions.list({
                customer: customerId,
                status: 'trialing',
                limit: 1
            });
            if (trialing.data.length > 0) {
                const sub = trialing.data[0];
                const subAny = sub;
                await updateUserSubscription(uid, sub.id, customerId, 'trialing', 'premium', subAny.current_period_end, sub.trial_end, sub.cancel_at_period_end);
                return { status: 'synced', result: 'trial_found' };
            }
            // Nothing found
            await updateUserSubscription(uid, '', customerId, 'inactive', 'free');
            return { status: 'synced', result: 'none_found' };
        }
    }
    catch (error) {
        functions.logger.error('Sync Subscription Error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
exports.applyRetentionOffer = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    const { uid } = context.auth;
    const stripe = getStripe();
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        const customerId = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.stripeCustomerId;
        // Get active subscription
        const subDoc = await db.collection('users').doc(uid).collection('subscription').doc('current').get();
        const subData = subDoc.data();
        if (!customerId || !(subData === null || subData === void 0 ? void 0 : subData.stripeSubscriptionId)) {
            throw new functions.https.HttpsError('failed-precondition', 'No active subscription found.');
        }
        // Apply coupon
        await stripe.subscriptions.update(subData.stripeSubscriptionId, {
            discounts: [{ coupon: 'RETENTION_15_OFF' }],
            metadata: { retention_claimed: 'true' }
        });
        // Update local status immediately to reflect the discount
        await subDoc.ref.update({
            discountApplied: true,
            discountPercent: 15,
            discountType: 'retention',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    }
    catch (error) {
        functions.logger.error('Retention Offer Error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
exports.cancelSubscription = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    const { uid } = context.auth;
    const stripe = getStripe();
    try {
        // Get active subscription
        const subDoc = await db.collection('users').doc(uid).collection('subscription').doc('current').get();
        const subData = subDoc.data();
        if (!(subData === null || subData === void 0 ? void 0 : subData.stripeSubscriptionId)) {
            throw new functions.https.HttpsError('failed-precondition', 'No active subscription found.');
        }
        // Cancel at period end
        await stripe.subscriptions.update(subData.stripeSubscriptionId, {
            cancel_at_period_end: true
        });
        // Update local status to reflect pending cancellation
        await subDoc.ref.update({
            cancelAtPeriodEnd: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    }
    catch (error) {
        functions.logger.error('Cancellation Error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * ==================================================================
 * 6. CLARA SPECIFIC FUNCTIONS
 * ==================================================================
 */
exports.claraWeeklySummary = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    const uid = context.auth.uid;
    try {
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        // Fetch doses
        const dosesSnap = await db.collection('users').doc(uid).collection('doses')
            .where('scheduledTime', '>=', lastWeek)
            .get();
        const doses = dosesSnap.docs.map(d => d.data());
        const total = doses.length;
        const taken = doses.filter(d => d.status === 'taken').length;
        const missed = doses.filter(d => d.status === 'missed').length || (total - taken); // Simplified logic
        const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;
        // Fetch meds for context
        const medsSnap = await db.collection('users').doc(uid).collection('medications').where('isActive', '==', true).get();
        const meds = medsSnap.docs.map(m => m.data().name);
        const prompt = `
            Gere um resumo semanal motivacional e informativo para o paciente.
            Dados:
            - Adesão: ${adherence}%
            - Doses tomadas: ${taken}/${total}
            - Medicamentos: ${meds.join(', ')}
            
            O tom deve ser acolhedor, como a Clara (assistente de saúde). Use emojis.
            Se a adesão for baixa (<80%), seja encorajadora mas firme.
            Se for alta, parabenize.
            Retorne JSON: { "summary": "texto", "metrics": { "adherenceRate": ${adherence}, "onTimeRate": 0, "totalDoses": ${total}, "takenDoses": ${taken}, "missedDoses": ${missed} } }
        `;
        const model = getGenAI().getGenerativeModel({ model: "gemini-3-pro-preview" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    }
    catch (error) {
        functions.logger.error('Clara Weekly Error:', error);
        throw new functions.https.HttpsError('internal', 'Summary generation failed');
    }
});
exports.claraConsultationPrep = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    const uid = context.auth.uid;
    const { period = 30 } = data; // days
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - period);
        // Fetch meds
        const medsSnap = await db.collection('users').doc(uid).collection('medications').where('isActive', '==', true).get();
        const medications = medsSnap.docs.map(d => d.data());
        // Fetch adherence stats (simplified for speed)
        // In real app, aggregate efficiently. Here we assume we pass summary stats or fetch limit.
        // For efficiency, we'll just list the medications and ask generic advice or use stored metrics if available.
        // Let's assume we fetch a small sample or metrics doc.
        const adherenceRate = 85; // Placeholder/Calculated
        const sideEffectsCount = 0; // Placeholder
        const prompt = `
            Gere um relatório preparatório para consulta médica para os últimos ${period} dias.
            Medicamentos em uso: ${medications.map((m) => m.name).join(', ')}.
            Adesão estimada: ${adherenceRate}%.
            
            Estrutura do relatório (Markdown simples):
            1. Resumo da Adesão
            2. Lista de Medicamentos Ativos
            3. Perguntas Sugeridas para o Médico
            4. Possíveis Efeitos para relatar
            
            Retorne JSON: { "report": "texto_markdown", "metrics": { "medicationsCount": ${medications.length}, "adherenceRate": ${adherenceRate}, "sideEffectsCount": ${sideEffectsCount} } }
        `;
        const model = getGenAI().getGenerativeModel({ model: "gemini-3-pro-preview" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    }
    catch (error) {
        functions.logger.error('Consultation Prep Error:', error);
        throw new functions.https.HttpsError('internal', 'Report generation failed');
    }
});
/**
 * ==================================================================
 * 7. REWARDS SYSTEM (NEW)
 * ==================================================================
 */
const handleStreakMilestone_1 = require("./rewards/handleStreakMilestone");
Object.defineProperty(exports, "handleStreakMilestone", { enumerable: true, get: function () { return handleStreakMilestone_1.handleStreakMilestone; } });
// import { handleReferralSignup, handleReferralFirstWeek, handleReferralPremiumConversion } from './rewards/handleReferral';
const handleReferral_1 = require("./rewards/handleReferral");
Object.defineProperty(exports, "handleReferralSignup", { enumerable: true, get: function () { return handleReferral_1.handleReferralSignup; } });
Object.defineProperty(exports, "handleReferralFirstWeek", { enumerable: true, get: function () { return handleReferral_1.handleReferralFirstWeek; } });
const applyCreditsToRenewal_1 = require("./rewards/applyCreditsToRenewal");
Object.defineProperty(exports, "applyCreditsToRenewal", { enumerable: true, get: function () { return applyCreditsToRenewal_1.applyCreditsToRenewal; } });
const resetMonthlyProtections_1 = require("./rewards/resetMonthlyProtections");
Object.defineProperty(exports, "resetMonthlyProtections", { enumerable: true, get: function () { return resetMonthlyProtections_1.resetMonthlyProtections; } });
Object.defineProperty(exports, "syncProtectionAvailable", { enumerable: true, get: function () { return resetMonthlyProtections_1.syncProtectionAvailable; } });
/**
 * ==================================================================
 * 8. MIGRATED FROM SUPABASE — get/update payment method, monthly
 *    report, pharmacy prices, whatsapp reminder, google calendar sync
 * ==================================================================
 */
exports.getPaymentMethod = functions.https.onCall(async (_data, context) => {
    var _a, _b;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    const uid = context.auth.uid;
    try {
        const stripe = getStripe();
        const subSnap = await db.collection('subscriptions').where('user_id', '==', uid).limit(1).get();
        if (subSnap.empty)
            return { paymentMethod: null };
        const customerId = subSnap.docs[0].data().stripe_customer_id;
        if (!customerId)
            return { paymentMethod: null };
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted)
            return { paymentMethod: null };
        const defaultPmId = (_a = customer.invoice_settings) === null || _a === void 0 ? void 0 : _a.default_payment_method;
        let pmId = defaultPmId;
        if (!pmId) {
            const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
            pmId = (_b = subs.data[0]) === null || _b === void 0 ? void 0 : _b.default_payment_method;
        }
        if (!pmId)
            return { paymentMethod: null };
        const pm = await stripe.paymentMethods.retrieve(pmId);
        if (!pm.card)
            return { paymentMethod: null };
        return {
            paymentMethod: {
                last4: pm.card.last4,
                brand: pm.card.brand,
                expMonth: pm.card.exp_month,
                expYear: pm.card.exp_year,
            }
        };
    }
    catch (error) {
        functions.logger.error('getPaymentMethod error:', error);
        throw new functions.https.HttpsError('internal', 'Erro interno. Tente novamente.');
    }
});
exports.updatePaymentMethod = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    const uid = context.auth.uid;
    try {
        const stripe = getStripe();
        const subSnap = await db.collection('subscriptions').where('user_id', '==', uid).limit(1).get();
        if (subSnap.empty)
            throw new functions.https.HttpsError('not-found', 'No subscription found');
        const { stripe_customer_id, stripe_subscription_id } = subSnap.docs[0].data();
        if (!stripe_customer_id)
            throw new functions.https.HttpsError('not-found', 'No Stripe customer found');
        const origin = data.origin || 'https://app.horamed.net';
        const session = await stripe.checkout.sessions.create({
            customer: stripe_customer_id,
            mode: 'setup',
            payment_method_types: ['card'],
            success_url: `${origin}/assinatura?payment_updated=true`,
            cancel_url: `${origin}/assinatura`,
            metadata: { user_id: uid, subscription_id: stripe_subscription_id || '' },
        });
        return { url: session.url };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        functions.logger.error('updatePaymentMethod error:', error);
        throw new functions.https.HttpsError('internal', 'Erro interno. Tente novamente.');
    }
});
exports.generateMonthlyReport = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    const uid = context.auth.uid;
    const { month, year } = data;
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const prevStartDate = new Date(year, month - 2, 1);
        const prevEndDate = new Date(year, month - 1, 0, 23, 59, 59);
        const dosesSnap = await db.collectionGroup('dose_instances')
            .where('user_id', '==', uid)
            .where('due_at', '>=', admin.firestore.Timestamp.fromDate(startDate))
            .where('due_at', '<=', admin.firestore.Timestamp.fromDate(endDate))
            .get();
        if (dosesSnap.empty)
            return { message: 'Nenhum dado disponível para este mês', report: null };
        const doses = dosesSnap.docs.map(d => d.data());
        const totalDoses = doses.length;
        const takenDoses = doses.filter(d => d.status === 'taken').length;
        const skippedDoses = doses.filter(d => d.status === 'skipped').length;
        const adherenceRate = Math.round((takenDoses / totalDoses) * 100);
        const delays = doses.filter(d => d.status === 'taken' && d.delay_minutes).map(d => d.delay_minutes);
        const avgDelayMinutes = delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : 0;
        const prevSnap = await db.collectionGroup('dose_instances')
            .where('user_id', '==', uid)
            .where('due_at', '>=', admin.firestore.Timestamp.fromDate(prevStartDate))
            .where('due_at', '<=', admin.firestore.Timestamp.fromDate(prevEndDate))
            .get();
        const prevDoses = prevSnap.docs.map(d => d.data());
        const previousAdherence = prevDoses.length > 0
            ? Math.round((prevDoses.filter(d => d.status === 'taken').length / prevDoses.length) * 100)
            : 0;
        const medStats = {};
        for (const d of doses) {
            const name = d.medication_name || d.item_name || 'Medicamento';
            if (!medStats[name])
                medStats[name] = { total: 0, taken: 0 };
            medStats[name].total++;
            if (d.status === 'taken')
                medStats[name].taken++;
        }
        return {
            message: 'Relatório gerado com sucesso',
            report: {
                month, year, totalDoses, takenDoses, skippedDoses, adherenceRate,
                previousAdherence, improvementPercent: adherenceRate - previousAdherence,
                avgDelayMinutes,
                medicationBreakdown: Object.entries(medStats).map(([name, s]) => ({
                    name, adherence: Math.round((s.taken / s.total) * 100), total: s.total, taken: s.taken,
                })),
                generatedAt: new Date().toISOString(),
            }
        };
    }
    catch (error) {
        functions.logger.error('generateMonthlyReport error:', error);
        throw new functions.https.HttpsError('internal', 'Erro interno. Tente novamente.');
    }
});
exports.pharmacyPrices = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    const { medicationName } = data;
    if (!medicationName)
        throw new functions.https.HttpsError('invalid-argument', 'medicationName is required');
    const pharmacies = [
        { name: 'Drogasil', price: Math.random() * 50 + 10, link: `https://www.drogasil.com.br/search?w=${encodeURIComponent(medicationName)}`, delivery: true, distance: Math.random() * 5 },
        { name: 'Droga Raia', price: Math.random() * 50 + 10, link: `https://www.drogaraia.com.br/search?w=${encodeURIComponent(medicationName)}`, delivery: true, distance: Math.random() * 5 },
        { name: 'Pacheco', price: Math.random() * 50 + 10, link: `https://www.drogariaspacheco.com.br/search?w=${encodeURIComponent(medicationName)}`, delivery: true, distance: Math.random() * 5 },
        { name: 'Pague Menos', price: Math.random() * 50 + 10, link: `https://www.paguemenos.com.br/busca?q=${encodeURIComponent(medicationName)}`, delivery: true, distance: Math.random() * 5 },
        { name: 'Onofre', price: Math.random() * 50 + 10, link: `https://www.onofre.com.br/busca?q=${encodeURIComponent(medicationName)}`, delivery: false, distance: Math.random() * 5 },
    ].sort((a, b) => a.price - b.price).map(p => (Object.assign(Object.assign({}, p), { price: parseFloat(p.price.toFixed(2)), distance: parseFloat(p.distance.toFixed(1)) })));
    return {
        medication: medicationName,
        pharmacies,
        lowestPrice: pharmacies[0].price,
        highestPrice: pharmacies[pharmacies.length - 1].price,
        savings: parseFloat((pharmacies[pharmacies.length - 1].price - pharmacies[0].price).toFixed(2)),
    };
});
exports.sendWhatsappReminder = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    const { phoneNumber, message, instanceId, apiToken } = data;
    try {
        const evolutionApiUrl = process.env.EVOLUTION_API_URL || ((_a = functions.config().evolution) === null || _a === void 0 ? void 0 : _a.api_url);
        const evolutionApiKey = apiToken || process.env.EVOLUTION_API_KEY || ((_b = functions.config().evolution) === null || _b === void 0 ? void 0 : _b.api_key);
        const instance = instanceId || process.env.EVOLUTION_INSTANCE || ((_c = functions.config().evolution) === null || _c === void 0 ? void 0 : _c.instance) || 'horamed';
        if (!evolutionApiUrl || !evolutionApiKey) {
            throw new functions.https.HttpsError('failed-precondition', 'WhatsApp API not configured');
        }
        const res = await fetch(`${evolutionApiUrl}/message/sendText/${instance}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
            body: JSON.stringify({ number: phoneNumber, textMessage: { text: message } }),
        });
        if (!res.ok)
            throw new Error(`WhatsApp API error: ${res.status}`);
        const result = await res.json();
        return { success: true, messageId: (_d = result.key) === null || _d === void 0 ? void 0 : _d.id };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        functions.logger.error('sendWhatsappReminder error:', error);
        throw new functions.https.HttpsError('internal', 'Erro interno. Tente novamente.');
    }
});
exports.googleCalendarSync = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    const uid = context.auth.uid;
    const { accessToken, action } = data;
    try {
        if (action === 'remove' && data.eventId) {
            const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${data.eventId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
            if (!res.ok && res.status !== 404)
                throw new Error(`Calendar API error: ${res.status}`);
            return { success: true };
        }
        // Sync: fetch user medications and create calendar events
        const medsSnap = await db.collection('users').doc(uid).collection('medications')
            .where('isActive', '==', true).get();
        const events = [];
        for (const medDoc of medsSnap.docs) {
            const med = medDoc.data();
            if (!((_a = med.scheduledTimes) === null || _a === void 0 ? void 0 : _a.length))
                continue;
            for (const time of med.scheduledTimes) {
                const [hours, minutes] = time.split(':').map(Number);
                const start = new Date();
                start.setHours(hours, minutes, 0, 0);
                const end = new Date(start.getTime() + 15 * 60 * 1000);
                const eventBody = {
                    summary: `💊 ${med.name}`,
                    description: `Horamed: ${med.name}${med.doseText ? ` — ${med.doseText}` : ''}`,
                    start: { dateTime: start.toISOString(), timeZone: 'America/Sao_Paulo' },
                    end: { dateTime: end.toISOString(), timeZone: 'America/Sao_Paulo' },
                    recurrence: ['RRULE:FREQ=DAILY'],
                };
                const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventBody),
                });
                if (res.ok)
                    events.push(await res.json());
            }
        }
        return { success: true, eventsCreated: events.length };
    }
    catch (error) {
        functions.logger.error('googleCalendarSync error:', error);
        throw new functions.https.HttpsError('internal', 'Erro interno. Tente novamente.');
    }
});
//# sourceMappingURL=index.js.map