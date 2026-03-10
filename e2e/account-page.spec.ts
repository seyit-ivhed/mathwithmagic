import { test, expect, type Page } from '@playwright/test';
import { buildAuthenticatedSessionScript, expectEventFired } from './helpers';

const AUTH_SESSION = {
    access_token: 'test-auth-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 9999999999,
    refresh_token: 'test-auth-refresh-token',
    user: { id: 'test-user-id', email: 'test@example.com' },
};

const AUTH_USER = { id: 'test-user-id', email: 'test@example.com' };

// Single object (not array) so Supabase .single() succeeds for SELECT calls
const PLAYER_PROFILE = (marketingConsent: boolean) => ({
    id: 'test-user-id',
    product_update_consent: marketingConsent,
});

async function setupAccountPage(page: Page, { marketingConsent = false } = {}) {
    await page.addInitScript(buildAuthenticatedSessionScript());

    await page.route('**/auth/v1/**', async (route) => {
        const url = route.request().url();
        const method = route.request().method();
        if (method === 'POST' && url.includes('/token')) {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTH_SESSION) });
        } else if (method === 'GET' && url.includes('/user')) {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTH_USER) });
        } else {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
        }
    });

    // Single-object response so Supabase .single() works for SELECT calls.
    // getOrCreateProfile uses .upsert().select().single(), so it also receives
    // a single object (data.id is all it needs).
    await page.route('**/rest/v1/player_profiles**', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(PLAYER_PROFILE(marketingConsent)),
        });
    });

    await page.route('**/rest/v1/game_states**', (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/rest/v1/player_entitlements**', (route) => {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
}

// ---------------------------------------------------------------------------
// Page structure
// ---------------------------------------------------------------------------

test.describe('Account Page - Structure', () => {
    test.beforeEach(async ({ page }) => {
        await setupAccountPage(page);
        await page.goto('/account');
        await expect(page.locator('[data-testid="account-page"]')).toBeVisible();
    });

    test('renders all settings sections', async ({ page }) => {
        await expect(page.locator('[data-testid="change-password-settings"]')).toBeVisible();
        await expect(page.locator('[data-testid="marketing-preferences-settings"]')).toBeVisible();
        await expect(page.locator('[data-testid="legal-settings"]')).toBeVisible();
        await expect(page.locator('[data-testid="delete-account-settings"]')).toBeVisible();
    });
});

// Separate describe so it has no auth beforeEach that would seed a session
test.describe('Account Page - Unauthenticated', () => {
    test('unauthenticated user is redirected to chronicle', async ({ page }) => {
        // No session in localStorage, auth API returns empty/error
        await page.route('**/auth/v1/**', (route) => {
            route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Not logged in' }) });
        });
        await page.route('**/rest/v1/**', (route) => {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        });
        await page.goto('/account');
        await expect(page).toHaveURL(/\/chronicle/, { timeout: 10000 });
    });
});

// Separate describe so back navigation can build its own history stack
test.describe('Account Page - Navigation', () => {
    test('back button navigates to previous page', async ({ page }) => {
        await setupAccountPage(page);
        // Build history: chronicle → account
        await page.goto('/chronicle/cover');
        await page.goto('/account');
        await expect(page.locator('[data-testid="account-page"]')).toBeVisible();

        await page.click('[data-testid="account-page-back-btn"]', { force: true });
        await expect(page).toHaveURL(/\/chronicle/);
    });
});

// ---------------------------------------------------------------------------
// Change Password
// ---------------------------------------------------------------------------

test.describe('Account Page - Change Password', () => {
    test.beforeEach(async ({ page }) => {
        await setupAccountPage(page);
        await page.goto('/account');
        await expect(page.locator('[data-testid="account-page"]')).toBeVisible();
    });

    test('sends password reset email and shows success message', async ({ page }) => {
        await page.click('[data-testid="change-password-btn"]', { force: true });
        await expect(page.locator('[data-testid="change-password-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="change-password-btn"]')).not.toBeVisible();
        await expectEventFired(page, 'password_reset_email_sent');
    });

    test('shows error message when email sending fails', async ({ page }) => {
        // Override the catch-all auth mock with a specific /recover failure
        await page.route('**/auth/v1/recover**', (route) => {
            route.fulfill({
                status: 422,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Failed to send email', code: 'email_send_failed' }),
            });
        });

        await page.click('[data-testid="change-password-btn"]', { force: true });
        await expect(page.locator('[data-testid="change-password-error"]')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Marketing Preferences
// ---------------------------------------------------------------------------

test.describe('Account Page - Marketing Preferences', () => {
    test.beforeEach(async ({ page }) => {
        await setupAccountPage(page, { marketingConsent: false });
        await page.goto('/account');
        await expect(page.locator('[data-testid="account-page"]')).toBeVisible();
    });

    test('checkbox is unchecked when consent is false', async ({ page }) => {
        await expect(page.locator('[data-testid="marketing-consent-checkbox"]')).not.toBeChecked();
    });

    test('toggling the checkbox saves preference and shows success', async ({ page }) => {
        // click() instead of check(): the checkbox is a controlled React component
        // with an async save handler, so state updates after the API response
        await page.locator('[data-testid="marketing-consent-checkbox"]').click({ force: true });
        await expect(page.locator('[data-testid="marketing-preferences-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="marketing-consent-checkbox"]')).toBeChecked();
    });

    test('shows error when saving preference fails', async ({ page }) => {
        // Register AFTER setupAccountPage so it's checked first (LIFO).
        // Fail only product_update_consent upserts; fulfill everything else with success data.
        await page.route('**/rest/v1/player_profiles**', (route) => {
            const body = route.request().postData() ?? '';
            if (body.includes('product_update_consent')) {
                route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'DB error' }) });
            } else {
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PLAYER_PROFILE(false)) });
            }
        });

        await page.locator('[data-testid="marketing-consent-checkbox"]').click({ force: true });
        await expect(page.locator('[data-testid="marketing-preferences-error"]')).toBeVisible();
    });
});

test.describe('Account Page - Marketing Preferences (initial consent true)', () => {
    test('checkbox is checked when consent is true', async ({ page }) => {
        await setupAccountPage(page, { marketingConsent: true });
        await page.goto('/account');
        await expect(page.locator('[data-testid="account-page"]')).toBeVisible();
        // Wait for the async SELECT to resolve and update the checkbox
        await expect(page.locator('[data-testid="marketing-consent-checkbox"]')).toBeChecked({ timeout: 5000 });
    });
});

// ---------------------------------------------------------------------------
// Legal Links
// ---------------------------------------------------------------------------

test.describe('Account Page - Legal Links', () => {
    test.beforeEach(async ({ page }) => {
        await setupAccountPage(page);
        await page.goto('/account');
        await expect(page.locator('[data-testid="account-page"]')).toBeVisible();
    });

    test('privacy policy link opens legal modal', async ({ page }) => {
        await page.click('[data-testid="settings-privacy-link"]', { force: true });
        await expect(page.locator('[data-testid="legal-modal"]')).toBeVisible();
    });

    test('terms of service link opens legal modal', async ({ page }) => {
        await page.click('[data-testid="settings-terms-link"]', { force: true });
        await expect(page.locator('[data-testid="legal-modal"]')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Delete Account
// ---------------------------------------------------------------------------

test.describe('Account Page - Delete Account', () => {
    test.beforeEach(async ({ page }) => {
        await setupAccountPage(page);
        await page.goto('/account');
        await expect(page.locator('[data-testid="account-page"]')).toBeVisible();
    });

    test('clicking delete shows confirmation form', async ({ page }) => {
        await page.click('[data-testid="delete-account-btn"]', { force: true });
        await expect(page.locator('[data-testid="delete-account-confirmation"]')).toBeVisible();
        await expect(page.locator('[data-testid="delete-account-btn"]')).not.toBeVisible();
    });

    test('cancel hides confirmation form and restores delete button', async ({ page }) => {
        await page.click('[data-testid="delete-account-btn"]', { force: true });
        await expect(page.locator('[data-testid="delete-account-confirmation"]')).toBeVisible();

        await page.click('[data-testid="delete-account-cancel-btn"]', { force: true });
        await expect(page.locator('[data-testid="delete-account-btn"]')).toBeVisible();
        await expect(page.locator('[data-testid="delete-account-confirmation"]')).not.toBeVisible();
    });

    test('acknowledge checkbox reveals password field and confirm button', async ({ page }) => {
        await page.click('[data-testid="delete-account-btn"]', { force: true });
        await expect(page.locator('[data-testid="delete-account-password-input"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="delete-account-confirm-btn"]')).not.toBeVisible();

        await page.locator('[data-testid="delete-account-acknowledge"] input').click({ force: true });
        await expect(page.locator('[data-testid="delete-account-password-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="delete-account-confirm-btn"]')).toBeVisible();
    });

    test('shows error when submitting without a password', async ({ page }) => {
        await page.click('[data-testid="delete-account-btn"]', { force: true });
        await page.locator('[data-testid="delete-account-acknowledge"] input').click({ force: true });
        await expect(page.locator('[data-testid="delete-account-confirm-btn"]')).toBeEnabled({ timeout: 10000 });
        await page.click('[data-testid="delete-account-confirm-btn"]', { force: true });
        await expect(page.locator('[data-testid="delete-account-error"]')).toBeVisible();
    });

    test('shows wrong password error', async ({ page }) => {
        await page.route('**/functions/v1/delete-account**', (route) => {
            route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Incorrect password' }),
            });
        });

        await page.click('[data-testid="delete-account-btn"]', { force: true });
        await page.locator('[data-testid="delete-account-acknowledge"] input').click({ force: true });
        await expect(page.locator('[data-testid="delete-account-confirm-btn"]')).toBeEnabled({ timeout: 10000 });
        await page.fill('[data-testid="delete-account-password-input"]', 'wrongpassword');
        await page.click('[data-testid="delete-account-confirm-btn"]', { force: true });

        await expect(page.locator('[data-testid="delete-account-error"]')).toBeVisible();
        // Confirmation form stays open so the user can correct their password
        await expect(page.locator('[data-testid="delete-account-confirmation"]')).toBeVisible();
    });

    test('successful deletion redirects to farewell page', async ({ page }) => {
        await page.route('**/functions/v1/delete-account**', (route) => {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
        });

        await page.click('[data-testid="delete-account-btn"]', { force: true });
        await page.locator('[data-testid="delete-account-acknowledge"] input').click({ force: true });
        await expect(page.locator('[data-testid="delete-account-confirm-btn"]')).toBeEnabled({ timeout: 10000 });
        await page.fill('[data-testid="delete-account-password-input"]', 'correctpassword');
        await page.click('[data-testid="delete-account-confirm-btn"]', { force: true });
        await expectEventFired(page, 'account_deletion_triggered');
        await expect(page).toHaveURL(/\/farewell/, { timeout: 10000 });
    });
});
