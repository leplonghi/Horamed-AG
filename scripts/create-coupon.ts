
import admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import Stripe from 'stripe'

// Load environment variables
config({ path: '.env.firebase' })

// Initialize Stripe (Test Mode Key)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_REMOVED", {
    apiVersion: '2025-01-27.acacia' as any,
});

async function main() {
    console.log('Creating Retention Coupon...');

    try {
        const coupon = await stripe.coupons.create({
            percent_off: 15,
            duration: 'repeating',
            duration_in_months: 12,
            name: 'Retenção 15% (1 Ano)',
            id: 'RETENTION_15_OFF' // Fixed ID so we can reference it easily
        });
        console.log('✅ Coupon Created:', coupon.id);
    } catch (error: any) {
        if (error.code === 'resource_already_exists') {
            console.log('⚠️ Coupon RETENTION_15_OFF already exists. Skipping creation.');
        } else {
            console.error('❌ Error creating coupon:', error);
        }
    }
}

main();
