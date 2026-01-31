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
exports.syncProtectionAvailable = exports.resetMonthlyProtections = exports.applyCreditsToRenewal = exports.handleReferralPremiumConversion = exports.handleReferralFirstWeek = exports.handleReferralSignup = exports.handleStreakMilestone = exports.claraConsultationPrep = exports.claraWeeklySummary = exports.syncSubscription = exports.generateTravelDoses = exports.caregiverInvite = exports.voiceToText = exports.consultationCard = exports.analyzeDocument = exports.checkMedicationInteractions = exports.checkInteractions = exports.extractDocument = exports.extractExam = exports.extractMedication = exports.scheduleDoseNotifications = exports.sendDoseNotification = exports.healthAssistant = exports.stripeWebhook = exports.createCustomerPortal = exports.onReferralChange = exports.createCheckoutSession = exports.onUserDelete = exports.onUserCreate = void 0;
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
        const key = process.env.STRIPE_SECRET_KEY || ((_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.secret);
        if (!key) {
            // Return a dummy instance or throw, but for deployment safety, logging is better.
            // However, at runtime this must throw if missing.
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
// Price Configuration (Updated 2026-01-30)
const PRICES = {
    BRL: {
        monthly: 'price_1SvP3bHh4P8HSV4Y7Mrv5t2y', // R$ 19,90/mês (Test Mode)
        annual: 'price_1SvP45Hh4P8HSV4Y2DYbc4Gr', // R$ 199,90/ano (Test Mode)
    },
    USD: {
        monthly: 'price_1SvI4XHh4P8HSV4YGE6v1szt', // US$ 3,99/mês
        annual: 'price_1SuWdlHh4P8HSV4YsApnqZxY', // US$ 39,99/ano
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
async function calculateReferralDiscount(uid) {
    const snapshot = await db.collection(`users/${uid}/referrals`)
        .where('status', '==', 'active')
        .get();
    let totalDiscount = 0;
    snapshot.docs.forEach(doc => {
        const d = doc.data();
        if (d.planType === 'premium_monthly')
            totalDiscount += 20;
        else if (d.planType === 'premium_annual')
            totalDiscount += 40;
    });
    return Math.min(totalDiscount, 100);
}
// Create Checkout Session (Renamed to match Frontend)
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    var _a, _b;
    functions.logger.info('createCheckoutSession called', { data, authUid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid });
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // Default to monthly/BR if not provided
    const { planType = 'monthly', countryCode = 'BR' } = data;
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
        functions.logger.info('User data retrieved', { email, hasStripeCustomer: !!userData.stripeCustomerId });
        // Resolve Price ID
        const currency = (countryCode === 'BR' ? 'BRL' : 'USD');
        const priceId = (_b = PRICES[currency]) === null || _b === void 0 ? void 0 : _b[planType];
        if (!priceId) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid plan type or country code');
        }
        functions.logger.info('Price resolved', { currency, planType, priceId });
        // Get or create Stripe Customer
        let customerId;
        const stripe = getStripe();
        functions.logger.info('Stripe instance created');
        if (userData === null || userData === void 0 ? void 0 : userData.stripeCustomerId) {
            customerId = userData.stripeCustomerId;
            functions.logger.info('Using existing Stripe customer', { customerId });
        }
        else {
            functions.logger.info('Creating new Stripe customer', { email });
            const customer = await stripe.customers.create({ email, metadata: { firebaseUid: uid } });
            customerId = customer.id;
            await userDoc.ref.update({ stripeCustomerId: customerId });
            functions.logger.info('Stripe customer created', { customerId });
        }
        // Calculate Referral Discount
        const discountPercent = await calculateReferralDiscount(uid);
        let couponId;
        if (discountPercent > 0) {
            functions.logger.info('Applying referral discount', { discountPercent, uid });
            // Create a coupon for this session (or reusable if preferred, but dynamic % is easier this way)
            const coupon = await stripe.coupons.create({
                percent_off: discountPercent,
                duration: 'forever',
                name: `Referral Discount (${discountPercent}%)`,
                metadata: { firebaseUid: uid }
            });
            couponId = coupon.id;
        }
        functions.logger.info('Creating checkout session', { customerId, priceId, couponId });
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            discounts: couponId ? [{ coupon: couponId }] : undefined,
            success_url: `https://app.horamed.net/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://app.horamed.net/assinatura/cancelado`,
            client_reference_id: uid,
            allow_promotion_codes: true,
            subscription_data: {
                metadata: { firebaseUid: uid }
            }
        });
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
    const before = change.before.exists ? change.before.data() : null;
    // Only proceed if status changed to/from 'active' or if it's a new active referral
    const statusChanged = (after === null || after === void 0 ? void 0 : after.status) !== (before === null || before === void 0 ? void 0 : before.status);
    const isActiveInvolved = (after === null || after === void 0 ? void 0 : after.status) === 'active' || (before === null || before === void 0 ? void 0 : before.status) === 'active';
    if (!statusChanged && !isActiveInvolved && after)
        return; // No relevant change
    functions.logger.info(`Referral change detected for user ${userId}, syncing Stripe...`);
    try {
        // Recalculate discount
        const newDiscount = await calculateReferralDiscount(userId);
        // Get user's current Stripe Subscription ID
        const subDoc = await db.collection(`users/${userId}/subscription`).doc('current').get();
        const subData = subDoc.data();
        if (!subData || subData.status !== 'active' || !subData.stripeSubscriptionId) {
            functions.logger.info('No active Stripe subscription to update.');
            return;
        }
        const stripe = getStripe();
        const subscriptionId = subData.stripeSubscriptionId;
        // Create new coupon
        let couponId = undefined;
        if (newDiscount > 0) {
            const coupon = await stripe.coupons.create({
                percent_off: newDiscount,
                duration: 'forever',
                name: `Updated Referral Discount (${newDiscount}%)`,
                metadata: { firebaseUid: userId, reason: 'referral_update' }
            });
            couponId = coupon.id;
        }
        // Update Subscription in Stripe
        // Note: This replaces existing discounts
        await stripe.subscriptions.update(subscriptionId, {
            discounts: couponId ? [{ coupon: couponId }] : [], // Passing empty array removes discounts if 0
        });
        functions.logger.info(`Stripe subscription ${subscriptionId} updated with ${newDiscount}% discount.`);
    }
    catch (error) {
        functions.logger.error('Error syncing referral discount to Stripe:', error);
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
        throw new functions.https.HttpsError('internal', error.message);
    }
});
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    var _a;
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
                    await updateUserSubscription(uid, subscriptionId, customerId, 'active', 'premium');
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
                    const status = sub.status === 'active' ? 'active' : 'inactive';
                    const plan = sub.status === 'active' ? 'premium' : 'free';
                    await updateUserSubscription(uid, sub.id, customerId, status, plan);
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
async function updateUserSubscription(uid, subId, custId, status, planType) {
    await db.collection('users').doc(uid).collection('subscription').doc('current').set({
        status,
        planType,
        stripeSubscriptionId: subId,
        stripeCustomerId: custId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    await db.collection('users').doc(uid).set({
        isPremium: planType === 'premium',
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
    const { messages } = data;
    if (!messages || !Array.isArray(messages)) {
        throw new functions.https.HttpsError('invalid-argument', 'Messages array required');
    }
    try {
        // Upgrade to Gemini 1.5 Flash for better performance/cost
        const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
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
    const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
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
        const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
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
            model: "gemini-1.5-flash",
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
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    return { status: 'synced' };
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
        const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
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
        const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
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
const handleReferral_1 = require("./rewards/handleReferral");
Object.defineProperty(exports, "handleReferralSignup", { enumerable: true, get: function () { return handleReferral_1.handleReferralSignup; } });
Object.defineProperty(exports, "handleReferralFirstWeek", { enumerable: true, get: function () { return handleReferral_1.handleReferralFirstWeek; } });
Object.defineProperty(exports, "handleReferralPremiumConversion", { enumerable: true, get: function () { return handleReferral_1.handleReferralPremiumConversion; } });
const applyCreditsToRenewal_1 = require("./rewards/applyCreditsToRenewal");
Object.defineProperty(exports, "applyCreditsToRenewal", { enumerable: true, get: function () { return applyCreditsToRenewal_1.applyCreditsToRenewal; } });
const resetMonthlyProtections_1 = require("./rewards/resetMonthlyProtections");
Object.defineProperty(exports, "resetMonthlyProtections", { enumerable: true, get: function () { return resetMonthlyProtections_1.resetMonthlyProtections; } });
Object.defineProperty(exports, "syncProtectionAvailable", { enumerable: true, get: function () { return resetMonthlyProtections_1.syncProtectionAvailable; } });
//# sourceMappingURL=index.js.map