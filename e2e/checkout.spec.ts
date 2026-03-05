import { test, expect } from '@playwright/test';
import {
    buildAuthenticatedSessionScript,
    mockSupabaseAuthForCheckout,
    mockSupabaseRestApis,
    mockStripe,
    mockPaymentIntent,
} from './helpers';

/**
 * Sets up all mocks needed for a checkout test where the user starts authenticated.
 * Call before page.goto('/checkout.html').
 */
async function setupAuthenticatedCheckout(page: Parameters<typeof mockStripe>[0]) {
    // Seed localStorage with a valid session so useAuth reads it on init
    // without making any auth HTTP calls
    await page.addInitScript(buildAuthenticatedSessionScript());
    // Safety net: intercept any auth HTTP calls that do fire
    await mockSupabaseAuthForCheckout(page);
    // Prevent real Stripe JS from loading
    await mockStripe(page);
    // Mock create-payment-intent edge function
    await mockPaymentIntent(page);
    // Mock REST APIs (player_entitlements resolves immediately on first poll)
    await mockSupabaseRestApis(page);
}

test.describe('Checkout Flow', () => {
    test('authenticated user sees checkout form, not account creation', async ({ page }) => {
        await setupAuthenticatedCheckout(page);
        await page.goto('/checkout.html');

        await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
        await expect(page.locator('[data-testid="account-creation-form"]')).not.toBeVisible();
    });

    test('payment form shows the price', async ({ page }) => {
        await setupAuthenticatedCheckout(page);
        await page.goto('/checkout.html');

        await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
        // Price is rendered inside the form by CheckoutForm
        await expect(page.locator('[data-testid="checkout-form"]')).toContainText('59 SEK');
    });

    test('successful payment shows the success screen', async ({ page }) => {
        await setupAuthenticatedCheckout(page);
        await page.goto('/checkout.html');

        await expect(page.locator('[data-testid="checkout-submit"]')).toBeVisible();
        await page.locator('[data-testid="checkout-submit"]').click();

        // stripe.confirmPayment() resolves immediately (mock), then verifyEntitlement()
        // finds the entitlement on the first query (mock), calling onSuccess()
        await expect(page.locator('[data-testid="success-screen"]')).toBeVisible({ timeout: 10000 });
    });

    test('shows success screen immediately when content is already owned', async ({ page }) => {
        // Override the default payment intent mock with alreadyOwned response
        await page.addInitScript(buildAuthenticatedSessionScript());
        await mockSupabaseAuthForCheckout(page);
        await mockStripe(page);
        await mockPaymentIntent(page, { alreadyOwned: true });
        await mockSupabaseRestApis(page);

        await page.goto('/checkout.html');

        // CheckoutOverlay receives alreadyOwned=true and calls onSuccess() directly
        await expect(page.locator('[data-testid="success-screen"]')).toBeVisible({ timeout: 10000 });
    });

    test('shows error when payment intent creation fails', async ({ page }) => {
        await page.addInitScript(buildAuthenticatedSessionScript());
        await mockSupabaseAuthForCheckout(page);
        await mockStripe(page);
        await mockSupabaseRestApis(page);

        // Override: edge function returns an error
        await page.route('**/functions/v1/create-payment-intent**', (route) => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal server error' }),
            });
        });

        await page.goto('/checkout.html');

        // CheckoutOverlay catches the error and renders the error state
        await expect(page.locator('text=Failed to initialize payment')).toBeVisible({ timeout: 10000 });
    });
});
