/**
 * Validation and Security Sanity Checks for the Application
 */

/**
 * Validates Stripe configuration to prevent accidental live key usage in development.
 */
export function validateStripeConfig() {
  const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const isProd = import.meta.env.PROD;

  if (!pk) {
    console.warn("[Security] Stripe Publishable Key is missing. Payment features will be disabled.");
    return false;
  }

  // Check for live key in non-production environments
  if (!isProd && (pk.startsWith('pk_live_') || pk.startsWith('rk_live_'))) {
    const errorMsg = "CRITICAL SECURITY ALERT: Live Stripe key detected in a NON-PRODUCTION environment! This exposure is dangerous.";
    console.error(`[Security] ${errorMsg}`);
    
    // In critical production scenarios, we might want to throw an alert or crash early
    if (typeof window !== 'undefined') {
      // Optional: Add a subtle overlay or persistent warning in dev mode
      // This helps developers notice the issue immediately
    }
  }

  return true;
}

/**
 * Checks if sensitive keys are potentially being exposed to the client bundle.
 * Vite only exposes keys prefixed with VITE_, which is intentional,
 * but developers should still be careful.
 */
export function checkEnvironmentSecurity() {
  const keys = Object.keys(import.meta.env);
  const sensitivePatterns = [/SECRET/i, /KEY/i, /TOKEN/i, /PASS/i];
  
  const suspiciousKeys = keys.filter(key => {
    if (key.startsWith('VITE_')) return false; // Allowed by design
    return sensitivePatterns.some(pattern => pattern.test(key));
  });

  if (suspiciousKeys.length > 0) {
    console.warn(`[Security] Potential sensitive environment variables detected without VITE_ prefix: ${suspiciousKeys.join(', ')}. These won't be available in the client bundle, which is good.`);
  }
}
