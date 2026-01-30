
import { test, expect } from '@playwright/test';

const generateRandomEmail = () => `testuser_${Math.floor(Math.random() * 100000)}@example.com`;
const generateRandomPassword = () => 'Test@1234'; // Meets requirements: 8 chars, Upper, Lower, Number

test.describe('Authenticated User Flow', () => {
    test('should register a new user and add a medication', async ({ page }) => {
        // 1. Register a new user
        await page.goto('/auth');

        // Switch to Sign Up
        const createAccountButton = page.getByRole('button', { name: 'Criar' });
        await createAccountButton.waitFor();
        await createAccountButton.click();

        // Fill Sign Up form
        const email = generateRandomEmail();
        const password = generateRandomPassword();

        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);

        // Accept terms
        // Wait for the checkbox to appear (it's animated)
        const termsCheckbox = page.locator('#terms');
        await termsCheckbox.waitFor();
        await termsCheckbox.check();

        // Submit
        await page.click('button[type="submit"]');

        // 2. Wait for navigation away from auth (to either welcome or dashboard)
        await page.waitForURL(url => !url.pathname.includes('/auth'), { timeout: 30000 });

        // Small delay to let any additional redirects settle
        await page.waitForTimeout(1500);

        // Check current location and handle accordingly
        const currentUrl = page.url();
        if (currentUrl.includes('bem-vindo')) {
            // On welcome page - click explore button if visible
            const exploreButton = page.getByText('Explorar App');
            const isVisible = await exploreButton.isVisible().catch(() => false);
            if (isVisible) {
                await exploreButton.click();
                await page.waitForURL(/\/hoje/, { timeout: 10000 });
            }
        }

        // Verify we're on the dashboard
        await expect(page).toHaveURL(/\/hoje/);

        // Support helper to check for global errors
        const checkForGlobalError = async () => {
            const errorOverlay = page.locator('#global-error-display');
            if (await errorOverlay.isVisible()) {
                const errorText = await errorOverlay.textContent();
                throw new Error(`Application crashed with Global Error: ${errorText}`);
            }
        };

        // 3. Add Medication via Floating Button
        await checkForGlobalError();

        // Locate the floating add button using test id
        const fab = page.getByTestId('floating-add-button');
        // Ensure navigation settled before looking for FAB
        await page.waitForTimeout(1000);

        // Check again before interaction
        await checkForGlobalError();

        await fab.waitFor({ state: 'visible', timeout: 10000 });
        await fab.click();

        // Select "Digitar manualmente"
        await page.getByText('Digitar manualmente').click();

        // Step 1: Medication Name
        await page.fill('input[placeholder="Buscar medicamento..."]', 'Paracetamol');

        // Click Next
        await page.getByRole('button', { name: /Próximo|Continuar/i }).click();

        // Step 2: Schedule (Use defaults: Daily)
        // Just click Save/Add
        // The button might say "Adicionar" or "Salvar"
        const saveButton = page.getByRole('button', { name: /Adicionar|Salvar/i }).filter({ has: page.locator('svg') }); // Check icon
        await saveButton.click();

        // 4. Verify Success
        await checkForGlobalError();

        // Should see a success toast
        await expect(page.getByText('adicionado com sucesso')).toBeVisible();

        // Should see the medication in the list (on /rotina or /hoje?)
        // Usually adds redirect to /rotina or stays.
        // Let's verify navigation or presence.
        // MedicationWizard.tsx navigates to '/rotina' on success: navigate('/rotina');
        await expect(page).toHaveURL(/\/rotina/);

        // Check if 'Paracetamol' is visible
        await expect(page.getByText('Paracetamol')).toBeVisible();
    });
});
