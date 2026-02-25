import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const db = admin.firestore();
const stripe = new Stripe(functions.config().stripe.secret_key, {
    apiVersion: '2025-01-27.acacia' as any,
});

/**
 * Webhook handler for Stripe events
 * Triggers actions based on payment success, subscription updates, etc.
 */
export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = functions.config().stripe.webhook_secret;

    let event;

    try {
        if (endpointSecret && sig) {
            event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
        } else {
            event = req.body;
        }
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    try {
        switch (event.type) {
            case "invoice.payment_succeeded":
                await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;
            case "customer.subscription.created":
                // Handle new subscription
                break;
            case "customer.subscription.deleted":
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (err: any) {
        console.error(`Error processing webhook: ${err.message}`);
        // Return 200 to Stripe to prevent retries on logic errors, but log it
        res.json({ received: true, error: err.message });
    }
});

/**
 * Handle successful payment
 * 1. Verify if user has a pending referral
 * 2. If yes, upgrade referral status to 'active'
 * 3. Grant rewards to referrer
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    const subscriptionId = (invoice as any).subscription as string;

    if (!customerId || !subscriptionId) return;

    // Get user by Stripe Customer ID
    const usersSnapshot = await db.collection("users")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

    if (usersSnapshot.empty) {
        console.error("User not found for Stripe Customer:", customerId);
        return;
    }

    const userId = usersSnapshot.docs[0].id;
    // Removed unused userDoc

    // Check if this is the FIRST payment (new subscription)
    // We can check billing_reason or if user was already premium
    if (invoice.billing_reason === 'subscription_create') {

        // Find pending referrals where this user is the "referred"
        // Since referrals are stored in subcollections of the REFERRER, we need a Collection Group Query
        const referralsSnapshot = await db.collectionGroup("referrals")
            .where("referredUserId", "==", userId)
            .where("status", "==", "pending")
            .limit(1)
            .get();

        if (!referralsSnapshot.empty) {
            const referralDoc = referralsSnapshot.docs[0];
            const referrerUserId = referralDoc.ref.parent.parent?.id; // users/{id}/referrals/{id} -> users/{id}

            if (!referrerUserId) return;

            // 1. Activate Referral
            await referralDoc.ref.update({
                status: "active",
                activatedAt: admin.firestore.FieldValue.serverTimestamp(),
                planType: "premium", // Simplified
                stripeSubscriptionId: subscriptionId
            });

            // 2. Grant Reward to Referrer
            // Simplified logic: Create a reward record. 
            // In a real scenario, this would create a Stripe Coupon or apply a direct credit

            // Generate a unique 20% off coupon for the referrer (one-time use or duration) 
            // OR apply negative balance to customer via Stripe API

            await grantReferrerReward(referrerUserId, userId);
        }
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    console.log(`Processing churn for customer ${customerId}`);

    // Logic to downgrade user processing
    // Also, mark any active referrals as 'churned' if necessary
}

async function grantReferrerReward(referrerId: string, referredId: string) {
    // Determine reward type based on referrer's status (Free vs Premium)
    // For now, simpler implementation:

    const referrerDoc = await db.collection('users').doc(referrerId).get();
    const referrerData = referrerDoc.data();
    const isPremium = referrerData?.subscription?.status === 'active';

    if (isPremium) {
        // Premium User: Gets Stripe Credit or Discount
        await db.collection(`users/${referrerId}/referralRewards`).add({
            rewardType: 'credits',
            amount: 500, // R$ 5,00 in cents
            currency: 'brl',
            status: 'pending_payout', // or 'applied_to_invoice'
            earnedFromUserId: referredId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // TODO: Call Stripe API to apply customer balance transaction
    } else {
        // Free User: Gets Premium Days or Extra Slots
        await db.collection(`users/${referrerId}/referralRewards`).add({
            rewardType: 'premium_days',
            amount: 30, // 30 days
            status: 'granted',
            earnedFromUserId: referredId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Add "premium_override" to user subscription or similar logic
    }
}
