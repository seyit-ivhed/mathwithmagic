import { test, expect } from '@playwright/test';
import {
    interceptSupabaseAuth,
    buildGameStateScript,
    buildAnonymousSessionScript,
    buildPermanentSessionScript,
    interceptAccountConversion,
    interceptCreatePaymentIntent,
} from './helpers';

// ─────────────────────────────────────────────────────────────────────────────
// Premium Store Modal (triggered from Chronicle when beginning adventure 2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Premium Store Modal', () => {
    test.beforeEach(async ({ page }) => {
        await interceptSupabaseAuth(page);
        // Adventure 1 completed, adventure 2 available via game progression
        await page.addInitScript(buildGameStateScript({
            adventureStatuses: { '1': 'COMPLETED', '2': 'AVAILABLE' },
        }));
    });

    test('premium modal appears when beginning a premium-locked adventure', async ({ page }) => {
        await page.goto('/chronicle/2');
        // Wait for the page to settle on the chapter view
        await expect(page.locator('[data-testid="chapter-page"]').first()).toBeVisible();

        const beginBtn = page.locator('[data-testid="begin-chapter-btn"]');
        await expect(beginBtn).toBeVisible();
        await beginBtn.click({ force: true });

        await expect(page.locator('[data-testid="premium-store-modal"]')).toBeVisible();
    });

    test('premium modal contains an unlock button', async ({ page }) => {
        await page.goto('/chronicle/2');
        await expect(page.locator('[data-testid="chapter-page"]').first()).toBeVisible();

        await page.click('[data-testid="begin-chapter-btn"]', { force: true });

        await expect(page.locator('[data-testid="premium-store-modal"]')).toBeVisible();
        await expect(page.locator('[data-testid="premium-unlock-btn"]')).toBeVisible();
    });

    test('clicking unlock button in premium modal navigates to checkout page', async ({ page }) => {
        await page.goto('/chronicle/2');
        await expect(page.locator('[data-testid="chapter-page"]').first()).toBeVisible();

        await page.click('[data-testid="begin-chapter-btn"]', { force: true });
        await expect(page.locator('[data-testid="premium-store-modal"]')).toBeVisible();

        // Clicking unlock triggers window.location.href = '/checkout.html'
        await page.click('[data-testid="premium-unlock-btn"]', { force: true });

        await expect(page).toHaveURL(/checkout\.html/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Account Creation Flow (checkout.html with anonymous session)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Account Creation Flow', () => {
    test.beforeEach(async ({ page }) => {
        await interceptSupabaseAuth(page);
        await page.addInitScript(buildAnonymousSessionScript());
    });

    test('shows account creation form for anonymous users', async ({ page }) => {
        await page.goto('/checkout.html');

        await expect(page.locator('[data-testid="account-creation-container"]')).toBeVisible();
        await expect(page.locator('[data-testid="account-email-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="account-confirm-email-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="account-password-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="account-submit-btn"]')).toBeVisible();
    });

    test('shows validation error for invalid email', async ({ page }) => {
        await page.goto('/checkout.html');
        await expect(page.locator('[data-testid="account-email-input"]')).toBeVisible();

        // Use evaluate + React synthetic events to bypass browser HTML5 form validation
        // so we can exercise our custom React validation logic directly.
        await page.evaluate(() => {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            const emailInput = document.querySelector('[data-testid="account-email-input"]') as HTMLInputElement;
            const confirmInput = document.querySelector('[data-testid="account-confirm-email-input"]') as HTMLInputElement;
            const passwordInput = document.querySelector('[data-testid="account-password-input"]') as HTMLInputElement;
            if (nativeInputValueSetter && emailInput) {
                nativeInputValueSetter.call(emailInput, 'not-an-email');
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (nativeInputValueSetter && confirmInput) {
                nativeInputValueSetter.call(confirmInput, 'not-an-email');
                confirmInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (nativeInputValueSetter && passwordInput) {
                nativeInputValueSetter.call(passwordInput, 'password123');
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            // Dispatch a synthetic submit event to bypass browser HTML5 validation
            const form = document.querySelector('.account-form') as HTMLFormElement;
            form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });

        await expect(page.locator('[data-testid="account-error-msg"]')).toBeVisible();
    });

    test('shows validation error when emails do not match', async ({ page }) => {
        await page.goto('/checkout.html');
        await expect(page.locator('[data-testid="account-email-input"]')).toBeVisible();

        await page.fill('[data-testid="account-email-input"]', 'user@example.com');
        await page.fill('[data-testid="account-confirm-email-input"]', 'other@example.com');
        await page.fill('[data-testid="account-password-input"]', 'password123');
        await page.click('[data-testid="account-submit-btn"]', { force: true });

        await expect(page.locator('[data-testid="account-error-msg"]')).toBeVisible();
    });

    test('shows validation error for a password that is too short', async ({ page }) => {
        await page.goto('/checkout.html');
        await expect(page.locator('[data-testid="account-email-input"]')).toBeVisible();

        await page.fill('[data-testid="account-email-input"]', 'user@example.com');
        await page.fill('[data-testid="account-confirm-email-input"]', 'user@example.com');
        await page.fill('[data-testid="account-password-input"]', '123');
        await page.click('[data-testid="account-submit-btn"]', { force: true });

        await expect(page.locator('[data-testid="account-error-msg"]')).toBeVisible();
    });

    test('successful account creation transitions to the payment step', async ({ page }) => {
        // Set up mocks for the account conversion API calls before navigation
        await interceptAccountConversion(page);
        await interceptCreatePaymentIntent(page, {
            clientSecret: 'pi_test_secret_fake12345',
        });

        await page.goto('/checkout.html');
        await expect(page.locator('[data-testid="account-email-input"]')).toBeVisible();

        await page.fill('[data-testid="account-email-input"]', 'newuser@example.com');
        await page.fill('[data-testid="account-confirm-email-input"]', 'newuser@example.com');
        await page.fill('[data-testid="account-password-input"]', 'securepass123');
        await page.click('[data-testid="account-submit-btn"]', { force: true });

        // After conversion, useAuth detects a non-anonymous user and renders the payment step
        await expect(page.locator('[data-testid="premium-checkout-container"]')).toBeVisible({
            timeout: 15000,
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Payment Flow (checkout.html with an already-authenticated user)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Payment Flow', () => {
    test.beforeEach(async ({ page }) => {
        await interceptSupabaseAuth(page);
        await page.addInitScript(buildPermanentSessionScript());
    });

    test('shows payment loading state while creating payment intent', async ({ page }) => {
        // Delay the response so the loading spinner is visible
        await page.route('**/functions/v1/create-payment-intent', async (route) => {
            await new Promise(resolve => setTimeout(resolve, 200));
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ clientSecret: 'pi_test_secret_fake12345' }),
            });
        });

        await page.goto('/checkout.html');
        await expect(page.locator('[data-testid="premium-checkout-container"]')).toBeVisible();
        await expect(page.locator('[data-testid="checkout-overlay-loading"]')).toBeVisible();
    });

    test('shows error state when payment intent creation fails', async ({ page }) => {
        await interceptCreatePaymentIntent(page, { error: true });

        await page.goto('/checkout.html');
        await expect(page.locator('[data-testid="premium-checkout-container"]')).toBeVisible();
        await expect(page.locator('[data-testid="checkout-overlay-error"]')).toBeVisible();
    });

    test('shows checkout overlay container when client secret is available', async ({ page }) => {
        await interceptCreatePaymentIntent(page, {
            clientSecret: 'pi_test_secret_fake12345',
        });

        await page.goto('/checkout.html');
        await expect(page.locator('[data-testid="premium-checkout-container"]')).toBeVisible();

        // Once the client secret is available the overlay container replaces the loading spinner
        await expect(page.locator('[data-testid="checkout-overlay-container"]')).toBeVisible();
    });

    test('shows success screen when payment is already owned', async ({ page }) => {
        await interceptCreatePaymentIntent(page, { alreadyOwned: true });

        await page.goto('/checkout.html');

        // When alreadyOwned is returned, onSuccess() fires immediately and shows the success screen
        await expect(page.locator('[data-testid="checkout-success"]')).toBeVisible({
            timeout: 10000,
        });
        await expect(page.locator('[data-testid="checkout-success-back-btn"]')).toBeVisible();
    });
});
