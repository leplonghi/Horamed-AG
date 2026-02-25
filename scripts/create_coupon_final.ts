
import Stripe from 'stripe';

const stripe = new Stripe('sk_test_REMOVED', {
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
            id: 'RETENTION_15_OFF'
        });
        console.log('✅ Coupon Created:', coupon.id);
    } catch (error: any) {
        if (error.code === 'resource_already_exists') {
            console.log('⚠️ Coupon RETENTION_15_OFF already exists.');
        } else {
            console.error('❌ Error:', error);
        }
    }
}

main();
