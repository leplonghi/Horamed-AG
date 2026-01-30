#!/usr/bin/env node

/**
 * Check User Subscription Script
 * 
 * This script checks the subscription data for a user in Firebase Firestore.
 * Usage: node scripts/check-subscription.js <email>
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../firebase-service-account.json'), 'utf8')
);

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
});

const auth = admin.auth();
const db = admin.firestore();

async function checkSubscription(email) {
    try {
        console.log(`🔍 Searching for user: ${email}`);

        // Get user by email
        const userRecord = await auth.getUserByEmail(email);
        console.log(`✅ Found user: ${userRecord.uid}\n`);

        const userId = userRecord.uid;

        // Check subscription subcollection
        console.log('📂 Checking subscription subcollection...');
        const subscriptionSnapshot = await db
            .collection('users')
            .doc(userId)
            .collection('subscription')
            .get();

        if (subscriptionSnapshot.empty) {
            console.log('❌ No documents in subscription subcollection');
        } else {
            console.log(`✅ Found ${subscriptionSnapshot.size} document(s):`);
            subscriptionSnapshot.forEach(doc => {
                console.log(`\n   Document ID: ${doc.id}`);
                console.log('   Data:', JSON.stringify(doc.data(), null, 2));
            });
        }

        // Check if there's a subscription field in the user document
        console.log('\n📂 Checking user document...');
        const userDoc = await db.collection('users').doc(userId).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData?.subscription) {
                console.log('✅ Found subscription field in user document:');
                console.log('   Data:', JSON.stringify(userData.subscription, null, 2));
            } else {
                console.log('❌ No subscription field in user document');
            }
        } else {
            console.log('❌ User document does not exist');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
    console.error('❌ Error: Email is required');
    console.log('\nUsage: node scripts/check-subscription.js <email>');
    process.exit(1);
}

// Run the script
checkSubscription(email)
    .then(() => {
        console.log('\n✅ Check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
