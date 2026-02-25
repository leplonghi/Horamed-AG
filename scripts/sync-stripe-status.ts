
import admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import Stripe from 'stripe'

// Load environment variables
config({ path: '.env.firebase' })

// Initialize Stripe
// We need the TEST key. Hardcoding it for this script to be sure, matching the backend one.
const stripe = new Stripe("sk_test_REMOVED", {
    apiVersion: '2025-01-27.acacia' as any,
});

// Initialize Firebase
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json')
let initialized = false;

if (fs.existsSync(serviceAccountPath)) {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'))
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'horamed-firebase',
        })
        initialized = true;

    } catch (e) {
        // Ignore valid JSON parse errors
    }
}

if (!initialized) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'horamed-firebase'
    });
}

const db = admin.firestore()

async function syncUser(email: string) {
    console.log(`\n🔄 Syncing user: ${email}...`);
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
        console.error(`❌ User ${email} not found locally.`);
        return;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const uid = userDoc.id;
    const stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
        console.log(`⚠️ User has no Stripe Customer ID. Skipping.`);
        // Ensure they are free
        await userDoc.ref.update({ isPremium: false });
        return;
    }

    console.log(`   Customer ID: ${stripeCustomerId}`);

    try {
        // Check Stripe
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'active',
        });

        const activeSub = subscriptions.data[0];

        if (activeSub) {
            console.log(`✅ FOUND ACTIVE SUBSCRIPTION in Stripe: ${activeSub.id}`);
            console.log(`   Plan: ${activeSub.plan.amount} ${activeSub.plan.currency.toUpperCase()}`);

            // Update Firestore to MATCH Stripe
            await userDoc.ref.update({ isPremium: true });
            await userDoc.ref.collection('subscription').doc('current').set({
                status: 'active',
                stripeSubscriptionId: activeSub.id,
                planType: 'premium',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`   -> Updated Firestore to PREMIUM.`);
        } else {
            console.log(`❌ NO active subscription found for this customer.`);

            // Update Firestore to MATCH Stripe (Free)
            await userDoc.ref.update({ isPremium: false });
            await userDoc.ref.collection('subscription').doc('current').set({
                status: 'canceled',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`   -> Updated Firestore to FREE.`);
        }

    } catch (err: any) {
        console.error(`   Error querying Stripe: ${err.message}`);
    }
}

async function main() {
    await syncUser('luis.longhi@undb.edu.br');
    await syncUser('sup.maranhao@gmail.com');
    // Add any others if needed
}

main().catch(console.error);
