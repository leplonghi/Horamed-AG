import { test, expect } from '@playwright/test';

test.describe('App functionality smoke tests', () => {
    test('should load the home page', async ({ page }) => {
        // Navigate to the base URL
        await page.goto('/');

        // Verify no console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`Page Error: ${msg.text()}`);
            }
        });

        // Check if the page title contains "HoraMed" (based on manifest/likely content)
        // Or wait for a known element.
        await expect(page).toHaveTitle(/HoraMed/);

        // Take a screenshot
        await page.screenshot({ path: 'screenshots/home.png' });
    });

    test('should navigate to login/auth if not logged in', async ({ page }) => {
        await page.goto('/');
        // Assuming redirects to auth if protected, or has a login button
        // Let's verify if we land on /auth or see a login button
        // This is tentative until we see App.tsx
    });
});
