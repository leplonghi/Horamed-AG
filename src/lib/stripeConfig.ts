/**
 * Stripe Product and Price Configuration
 * 
 * IMPORTANT: These price IDs are from your live Stripe account.
 * Separate products for BRL (Brazil) and USD (International).
 */

// International prices (USD) - Account: AY2hnWxlHu
export const STRIPE_PRICES_USD = {
  monthly: 'price_1SvI4XHh4P8HSV4YGE6v1szt', // $3.99/month
  annual: 'price_1SuWdlHh4P8HSV4YsApnqZxY',  // $39.99/year
  lifetime: 'price_1T5ZrAHh4P8HSV4YvS5ECHve', // $99.00 lifetime
} as const;

// Brazilian prices (BRL) - Account: AY2hnWxlHu
export const STRIPE_PRICES_BRL = {
  monthly: 'price_1SvI3uHh4P8HSV4YQvyCQGtN', // R$ 19,90/mês
  annual: 'price_1StuprHh4P8HSV4YRO4eI5YE',  // R$ 199,90/ano
  lifetime: 'price_1T5ZrAHh4P8HSV4YKrPTGhCg', // R$ 499,00 lifetime
} as const;

// Legacy export for backward compatibility
export const STRIPE_PRICES = STRIPE_PRICES_BRL;

export const STRIPE_PRODUCTS = {
  // BRL Products
  premiumMonthlyBRL: 'prod_TtBQvShFDZtpfU',
  premiumAnnualBRL: 'prod_TtBQUlvlE0CONT',
  // USD Products
  premiumMonthlyUSD: 'prod_TtlNaSxV3G8r5t',
  premiumAnnualUSD: 'prod_TtlOLvkdCLQrRN',
  // Legacy exports
  premiumMonthly: 'prod_TtBQvShFDZtpfU',
  premiumAnnual: 'prod_TtBQUlvlE0CONT',
  premiumLifetimeBRL: 'prod_U3hF8vjIzyKFH5',
  premiumLifetimeUSD: 'prod_U3hFyuAC8K0EIL',
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
  lifetime: {
    brl: 499.90,
    usd: 99.99,
  },
  trial_days: 7,
} as const;

// Lusophone countries that should see Portuguese and BRL pricing (only Brazil)
export const PORTUGUESE_COUNTRIES = ['BR', 'PT', 'MO', 'AO', 'MZ'];
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
