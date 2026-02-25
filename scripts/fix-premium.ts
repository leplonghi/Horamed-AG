
import admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.firebase' })

// Initialize Firebase Admin SDK
// Try to use service account if valid, otherwise fallback to default credentials
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json')
let initialized = false;

if (fs.existsSync(serviceAccountPath)) {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'))
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'horamed-firebase',
        })
        console.log("✅ Using Service Account credential.");
        initialized = true;
    } catch (e) {
        console.warn("⚠️ Service account file exists but failed to load. Trying default credentials.");
    }
}

if (!initialized) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'horamed-firebase'
        });
        console.log("✅ Using Application Default Credentials.");
    } catch (e) {
        console.error("❌ Failed to initialize Firebase.");
        process.exit(1);
    }
}

const db = admin.firestore()

async function main() {
    // Found user ID: hdLjWTBkPSOXjPzL9LdaDdU0UIg2
    const uid = 'hdLjWTBkPSOXjPzL9LdaDdU0UIg2';
    console.log(`🔍 Updating user: ${uid}...`);

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        console.error('❌ User doc not found!');
        process.exit(1);
    }

    console.log(`✅ Found user: ${userDoc.data()?.email}`);

    // Update User to Premium
    await userRef.update({
        isPremium: true,
        stripeCustomerId: 'cus_TtqiLxTXDd0SD8' // Known good ID from Stripe
    });
    console.log('✅ Updated user.isPremium = true');

    // Create/Update Subscription Doc
    const subRef = userRef.collection('subscription').doc('current');
    await subRef.set({
        status: 'active',
        planType: 'premium', // Make sure this matches frontend expectations
        interval: 'year',
        stripeCustomerId: 'cus_TtqiLxTXDd0SD8',
        stripeSubscriptionId: 'sub_manual_fix_v3',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('✅ Created active subscription document.');
    console.log('\n🎉 SUCCESS! Refresh the app (F5) and check Premium status.');
}

main().catch(console.error);
