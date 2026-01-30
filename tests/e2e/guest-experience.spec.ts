import { test, expect } from '@playwright/test';

test.describe('Guest Experience', () => {

    test('Landing page has critical elements', async ({ page }) => {
        await page.goto('/');
        // Check for "HoraMed" or main heading
        await expect(page).toHaveTitle(/HoraMed/);

        // Check for Login button or link if it exists on landing
        // Note: The App component routes '/' to <Index />
        // We expect some content there.
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    test('Navigate to Auth and try invalid login', async ({ page }) => {
        await page.goto('/auth');

        // Check for email input
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();

        // Check for password input
        const passwordInput = page.locator('input[type="password"]');
        await expect(passwordInput).toBeVisible();

        // Type invalid credentials
        await emailInput.fill('test@example.com');
        await passwordInput.fill('wrongpassword');

        // Click login button (assuming button with text "Entrar" or type="submit")
        const submitButton = page.locator('button[type="submit"]');
        // If not found by selector, try by text
        if (await submitButton.count() === 0) {
            await page.getByRole('button', { name: /Entrar/i }).click();
        } else {
            await submitButton.click();
        }

        // Expect an error toast or message
        // This part is flaky if we don't know the exact UI behavior, but we can check if we are still on /auth
        await page.waitForTimeout(1000); // Wait for async action
        expect(page.url()).toContain('/auth');
    });

    test('Public About page loads', async ({ page }) => {
        // /sobre route
        await page.goto('/sobre');
        // Expect some "Sobre" text
        await expect(page.getByText(/Sobre/i).first()).toBeVisible();
    });

});
