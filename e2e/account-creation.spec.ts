import { test, expect } from '@playwright/test';
import {
    interceptSupabaseAuth,
    mockSupabaseAuthForConversion,
    mockSupabaseAuthForAlreadyRegistered,
    mockSupabaseRestApis,
    mockStripe,
    mockPaymentIntent,
} from './helpers';

const VALID_EMAIL = 'newuser@example.com';
const VALID_PASSWORD = 'password123';

test.describe('Account Creation Step', () => {
    test('shows account creation form for unauthenticated user', async ({ page }) => {
        await interceptSupabaseAuth(page);
        await page.goto('/checkout.html');
        await expect(page.locator('[data-testid="account-creation-form"]')).toBeVisible();
    });

    test('shows validation error for invalid email', async ({ page }) => {
        await interceptSupabaseAuth(page);
        await page.goto('/checkout.html');

        await page.locator('[data-testid="age-consent-checkbox"]').check();
        await page.locator('[data-testid="terms-consent-checkbox"]').check();
        await page.locator('[data-testid="email-input"]').fill('not-an-email');
        await page.locator('[data-testid="confirm-email-input"]').fill('not-an-email');
        await page.locator('[data-testid="password-input"]').fill(VALID_PASSWORD);
        await page.locator('[data-testid="account-creation-submit"]').click({ force: true });

        await expect(page.locator('[data-testid="form-error"]')).toBeVisible();
    });

    test('shows validation error when emails do not match', async ({ page }) => {
        await interceptSupabaseAuth(page);
        await page.goto('/checkout.html');

        await page.locator('[data-testid="age-consent-checkbox"]').check();
        await page.locator('[data-testid="terms-consent-checkbox"]').check();
        await page.locator('[data-testid="email-input"]').fill(VALID_EMAIL);
        await page.locator('[data-testid="confirm-email-input"]').fill('different@example.com');
        await page.locator('[data-testid="password-input"]').fill(VALID_PASSWORD);
        await page.locator('[data-testid="account-creation-submit"]').click({ force: true });

        await expect(page.locator('[data-testid="form-error"]')).toBeVisible();
    });

    test('shows validation error for password that is too short', async ({ page }) => {
        await interceptSupabaseAuth(page);
        await page.goto('/checkout.html');

        await page.locator('[data-testid="age-consent-checkbox"]').check();
        await page.locator('[data-testid="terms-consent-checkbox"]').check();
        await page.locator('[data-testid="email-input"]').fill(VALID_EMAIL);
        await page.locator('[data-testid="confirm-email-input"]').fill(VALID_EMAIL);
        await page.locator('[data-testid="password-input"]').fill('abc');
        await page.locator('[data-testid="account-creation-submit"]').click({ force: true });

        await expect(page.locator('[data-testid="form-error"]')).toBeVisible();
    });

    test('shows error when email is already registered', async ({ page }) => {
        // The PUT /auth/v1/user call returns 422 for this scenario
        await mockSupabaseAuthForAlreadyRegistered(page);
        await page.goto('/checkout.html');

        await page.locator('[data-testid="age-consent-checkbox"]').check();
        await page.locator('[data-testid="terms-consent-checkbox"]').check();
        await page.locator('[data-testid="email-input"]').fill(VALID_EMAIL);
        await page.locator('[data-testid="confirm-email-input"]').fill(VALID_EMAIL);
        await page.locator('[data-testid="password-input"]').fill(VALID_PASSWORD);
        await page.locator('[data-testid="account-creation-submit"]').click({ force: true });

        await expect(page.locator('[data-testid="form-error"]')).toBeVisible();
    });

    test('successful account creation transitions to checkout form', async ({ page }) => {
        // All auth calls needed for anonymous → authenticated conversion
        await mockSupabaseAuthForConversion(page);
        // REST endpoints for profile sync and entitlement polling
        await mockSupabaseRestApis(page);
        // Prevent real Stripe JS from loading
        await mockStripe(page);
        // Edge function returns a fake client secret so CheckoutOverlay can mount
        await mockPaymentIntent(page);

        await page.goto('/checkout.html');

        await expect(page.locator('[data-testid="account-creation-form"]')).toBeVisible();

        await page.locator('[data-testid="age-consent-checkbox"]').check();
        await page.locator('[data-testid="terms-consent-checkbox"]').check();
        await page.locator('[data-testid="email-input"]').fill(VALID_EMAIL);
        await page.locator('[data-testid="confirm-email-input"]').fill(VALID_EMAIL);
        await page.locator('[data-testid="password-input"]').fill(VALID_PASSWORD);
        await page.locator('[data-testid="account-creation-submit"]').click({ force: true });

        // After refreshSession fires TOKEN_REFRESHED, useAuth updates to the
        // authenticated user and CheckoutPage swaps in CheckoutOverlay
        await expect(page.locator('[data-testid="checkout-overlay"]')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('[data-testid="account-creation-form"]')).not.toBeVisible();
    });
});
