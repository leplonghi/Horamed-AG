#!/usr/bin/env node

/**
 * Set Premium User Script
 * 
 * This script sets a user as premium in Firebase Firestore.
 * Usage: node scripts/set-premium-user.js <email>
 * Example: node scripts/set-premium-user.js leplonghi@gmail.com
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

async function setPremiumUser(email) {
    try {
        console.log(`🔍 Searching for user: ${email}`);

        // Get user by email
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
            console.log(`✅ Found user: ${userRecord.uid}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.error(`❌ User not found in Firebase Auth: ${email}`);
                console.log('\n💡 Tip: Make sure the user has signed up in the app first.');
                process.exit(1);
            }
            throw error;
        }

        const userId = userRecord.uid;

        // Create premium subscription document
        const subscriptionData = {
            id: 'current',
            userId: userId,
            planType: 'premium',
            status: 'active',
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: null, // null = never expires
            trialEndsAt: null,
            trialUsed: false,
            priceVariant: 'A',
            canceledAt: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Update subscription in Firestore
        const subscriptionRef = db
            .collection('users')
            .doc(userId)
            .collection('subscription')
            .doc('current');

        await subscriptionRef.set(subscriptionData, { merge: true });

        console.log(`\n✅ SUCCESS! User is now premium:`);
        console.log(`   Email: ${email}`);
        console.log(`   UID: ${userId}`);
        console.log(`   Plan: premium`);
        console.log(`   Status: active`);
        console.log(`   Expires: never`);
        console.log(`\n🎉 The user now has full premium access!`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
    console.error('❌ Error: Email is required');
    console.log('\nUsage: node scripts/set-premium-user.js <email>');
    console.log('Example: node scripts/set-premium-user.js leplonghi@gmail.com');
    process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    console.error(`❌ Error: Invalid email format: ${email}`);
    process.exit(1);
}

// Run the script
setPremiumUser(email)
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
