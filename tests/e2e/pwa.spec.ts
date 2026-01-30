
import { test, expect } from '@playwright/test';

test.describe('PWA Support', () => {
    test('should provide a valid manifest', async ({ request }) => {
        const response = await request.get('/manifest.webmanifest');
        expect(response.status()).toBe(200);
        const manifest = await response.json();
        expect(manifest.name).toBe('HoraMed - Gestão Completa da Sua Saúde');
        expect(manifest.display).toBe('standalone');
        expect(manifest.start_url).toBe('/hoje?source=pwa');
    });

    test('should register a service worker', async ({ page }) => {
        await page.goto('/');
        // Wait for the service worker to be registered
        await page.waitForTimeout(3000); // Give it some time
        const isServiceWorkerReady = await page.evaluate(async () => {
            if (!('serviceWorker' in navigator)) return false;
            const registration = await navigator.serviceWorker.getRegistration();
            return !!registration;
        });
        expect(isServiceWorkerReady).toBe(true);
    });
});
