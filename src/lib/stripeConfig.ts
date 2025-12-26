/**
 * Stripe Product and Price Configuration
 * 
 * IMPORTANT: These price IDs are from your live Stripe account.
 * Separate products for BRL (Brazil) and USD (International).
 */

// Brazilian prices (BRL)
export const STRIPE_PRICES_BRL = {
  monthly: 'price_1SYEVNAY2hnWxlHujMBQSYTt', // R$ 19,90/mês
  annual: 'price_1SYEWmAY2hnWxlHuNegLluyC',  // R$ 199,90/ano
} as const;

// International prices (USD)
export const STRIPE_PRICES_USD = {
  monthly: 'price_1SieJOAY2hnWxlHuJLfSNRz9', // $3.99/month
  annual: 'price_1SieJtAY2hnWxlHuAOa6m5nu',  // $39.99/year
} as const;

// Legacy export for backward compatibility
export const STRIPE_PRICES = STRIPE_PRICES_BRL;

export const STRIPE_PRODUCTS = {
  // BRL Products
  premiumMonthlyBRL: 'prod_TVEzdnYZnmxoSK',
  premiumAnnualBRL: 'prod_TVF02XNQOV4kXy',
  // USD Products
  premiumMonthlyUSD: 'prod_Tg0KzIrKEcVNnq',
  premiumAnnualUSD: 'prod_Tg0K1gsxmniVxE',
  // Legacy exports
  premiumMonthly: 'prod_TVEzdnYZnmxoSK',
  premiumAnnual: 'prod_TVF02XNQOV4kXy',
} as const;

export const PRICING = {
  brl: {
    monthly: 19.90,
    annual: 199.90,
    currency: 'BRL',
    symbol: 'R$',
  },
  usd: {
    monthly: 3.99,
    annual: 39.99,
    currency: 'USD',
    symbol: '$',
  },
  trial_days: 7,
} as const;

// Lusophone countries that should see Portuguese and BRL pricing (only Brazil)
export const PORTUGUESE_COUNTRIES = ['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL'];
export const BRL_COUNTRIES = ['BR']; // Only Brazil uses BRL

// Helper to get price config based on country
export function getPriceConfig(countryCode: string) {
  const isBrazil = countryCode === 'BR';
  return {
    prices: isBrazil ? STRIPE_PRICES_BRL : STRIPE_PRICES_USD,
    pricing: isBrazil ? PRICING.brl : PRICING.usd,
    currency: isBrazil ? 'BRL' : 'USD',
  };
}

// Helper to get language based on country
export function getLanguageByCountry(countryCode: string): 'pt' | 'en' {
  return PORTUGUESE_COUNTRIES.includes(countryCode) ? 'pt' : 'en';
}
