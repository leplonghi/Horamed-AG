# HoraMed Stripe Configuration (Firebase Edition)

## Status: MIGRATED TO FIREBASE

The Stripe integration has been migrated from Supabase Edge Functions to **Firebase Cloud Functions** to ensure compatibility with Firebase Auth.

---

## Account Information

| Field | Value |
|-------|-------|
| Account ID | `acct_1SDoIOAY2hnWxlHu` |
| Account Name | HoraMed |

---

## Price IDs (Correct & Active)

### BRL (Brazilian Real)

| Plan | Price ID | Amount |
|------|----------|--------|
| Monthly | `price_1Stun3AY2hnWxlHuDEEMRVTs` | R$ 19,90 |
| Annual | `price_1SuWEwAY2hnWxlHuG2WrgNhx` | R$ 199,90 |

### USD (US Dollar)

| Plan | Price ID | Amount |
|------|----------|--------|
| Monthly | `price_1SturuAY2hnWxlHuHVLxgKae` | $3.99 |
| Annual | `price_1SieJtAY2hnWxlHuAOa6m5nu` | $39.99 |

---

## Backend Configuration (Firebase Functions)

### Functions Implemented
1. **`createCheckoutSession`** (Callable): Creates Stripe Session for logged-in Firebase user.
2. **`stripeWebhook`** (HTTP Request): Handles `checkout.session.completed`, subscription updates/deletions.
3. **`syncSubscription`** (Callable): Manually syncs Stripe status to Firestore.

### Webhook Endpoint
The Webhook URL for Stripe Dashboard should be:
```
https://us-central1-<YOUR-PROJECT-ID>.cloudfunctions.net/stripeWebhook
```

### Events to Listen
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

## Deployment Instructions

To deploy the updated functions with Stripe support:

1. **Set Stripe Secret:**
   ```bash
   firebase functions:config:set stripe.secret="sk_live_..." stripe.webhook_secret="whsec_..."
   ```

2. **Deploy Functions:**
   ```bash
   firebase deploy --only functions
   ```

3. **Verify:**
   - Go to Stripe Dashboard > Developers > Webhooks.
   - Update the endpoint URL to the one provided by Firebase deploy output.

---

## Firestore Schema

Subscription data is stored in:
`users/{uid}/subscription/current`

Fields:
- `status`: 'active', 'trialing', 'past_due', 'canceled', etc.
- `planType`: 'premium' or 'free' (derived from status)
- `stripeCustomerId`: 'cus_...'
- `stripeSubscriptionId`: 'sub_...'
- `trialEndsAt`: Timestamp
- `currentPeriodEnd`: Timestamp
