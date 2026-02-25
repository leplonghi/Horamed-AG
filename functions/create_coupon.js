
const admin = require('firebase-admin');
const stripeLib = require('stripe');

// COMO USAR:
// 1. Pegue sua chave secreta: firebase functions:config:get > stripe.secret_key
// 2. Execute: STRIPE_KEY=sk_live_... node create_coupon.js

const STRIPE_KEY = process.env.STRIPE_KEY;

if (!STRIPE_KEY) {
    console.error('❌ ERRO: Chave do Stripe não fornecida.');
    console.log('Use: set STRIPE_KEY=sk_live_... && node create_coupon.js (Windows)');
    console.log('ou: STRIPE_KEY=sk_live_... node create_coupon.js (Mac/Linux)');
    process.exit(1);
}

const stripe = stripeLib(STRIPE_KEY);

async function createCoupon() {
    console.log('⏳ Criando cupom RETENTION_15_OFF...');

    try {
        // Verificar se já existe
        try {
            await stripe.coupons.retrieve('RETENTION_15_OFF');
            console.log('✅ Cupom RETENTION_15_OFF já existe!');
            return;
        } catch (e) {
            // Ignorar se não existe (404)
        }

        const coupon = await stripe.coupons.create({
            id: 'RETENTION_15_OFF',
            percent_off: 15,
            duration: 'repeating',
            duration_in_months: 12,
            name: 'Desconto de Retenção (15% OFF)',
        });

        console.log(`✅ Sucesso! Cupom criado: ${coupon.id} (${coupon.percent_off}% OFF por ${coupon.duration_in_months} meses)`);

    } catch (error) {
        console.error('❌ Erro ao criar cupom:', error.message);
    }
}

createCoupon();
