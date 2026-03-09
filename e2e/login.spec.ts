import { test, expect, type Page } from '@playwright/test';
import { interceptSupabaseAuth, mockSupabaseRestApis, buildGameStateScript } from './helpers';

const AUTH_USER = {
    id: 'test-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    email_confirmed_at: '2024-01-01T00:00:00.000Z',
    is_anonymous: false,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    app_metadata: { provider: 'email' },
    user_metadata: {},
};

const AUTH_SESSION = {
    access_token: 'test-auth-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 9999999999,
    refresh_token: 'test-auth-refresh-token',
    user: AUTH_USER,
};

function injectNoAnimationsScript(page: Page) {
    return page.addInitScript(() => {
        const inject = () => {
            const style = document.createElement('style');
            style.textContent = '*, *::before, *::after { animation: none !important; transition: none !important; }';
            (document.head || document.documentElement).appendChild(style);
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', inject, { once: true });
        } else {
            inject();
        }
    });
}

/**
 * Intercepts Supabase auth endpoints for a successful login flow.
 * Also mocks REST APIs (player_profiles, player_entitlements) because
 * useInitializeGame re-runs after auth state changes.
 */
async function mockSupabaseAuthForLogin(page: Page): Promise<void> {
    await injectNoAnimationsScript(page);

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

    // Mock REST APIs that useInitializeGame calls after auth state changes
    await mockSupabaseRestApis(page);

    // Mock game_states table (pullState/pushState in PersistenceService)
    await page.route('**/rest/v1/game_states**', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });
}

/**
 * Intercepts Supabase auth endpoints to return an invalid credentials error.
 */
async function mockSupabaseAuthForLoginFailure(page: Page): Promise<void> {
    await injectNoAnimationsScript(page);

    await page.route('**/auth/v1/**', async (route) => {
        const url = route.request().url();
        const method = route.request().method();

        if (method === 'POST' && url.includes('/token')) {
            route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
            });
        } else {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
        }
    });
}

test.describe('Login Flow', () => {

    test('player can navigate from cover to login page', async ({ page }) => {
        await interceptSupabaseAuth(page);
        await page.goto('/chronicle/cover');
        await page.click('[data-testid="cover-login-btn"]', { force: true });
        await expect(page).toHaveURL(/\/chronicle\/login/);
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    test('login page shows email and password fields', async ({ page }) => {
        await interceptSupabaseAuth(page);
        await page.goto('/chronicle/login');
        await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="login-password-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="login-submit-btn"]')).toBeVisible();
    });

    test('player can go back to cover from login page', async ({ page }) => {
        await interceptSupabaseAuth(page);
        await page.goto('/chronicle/login');
        await expect(page.locator('[data-testid="login-back-btn"]')).toBeVisible();
        await page.locator('[data-testid="login-back-btn"]').click();
        await expect(page).toHaveURL(/\/chronicle\/cover/, { timeout: 10000 });
    });

    test('player can navigate to forgot password from login page', async ({ page }) => {
        await interceptSupabaseAuth(page);
        await page.goto('/chronicle/login');
        await page.click('[data-testid="login-forgot-password-btn"]', { force: true });
        await expect(page).toHaveURL(/\/chronicle\/forgot-password/);
    });

    test('successful login shows success page with continue button', async ({ page }) => {
        await mockSupabaseAuthForLogin(page);
        await page.goto('/chronicle/login');

        await page.fill('[data-testid="login-email-input"]', 'test@example.com');
        await page.fill('[data-testid="login-password-input"]', 'password123');
        await page.click('[data-testid="login-submit-btn"]', { force: true });

        await expect(page).toHaveURL(/\/chronicle\/login-success/, { timeout: 10000 });
        await expect(page.locator('[data-testid="login-success-continue-btn"]')).toBeVisible({ timeout: 10000 });
    });

    test('clicking continue on success page navigates to chronicle', async ({ page }) => {
        await mockSupabaseAuthForLogin(page);

        // Seed game state so the redirect logic has progress to work with
        await page.addInitScript(buildGameStateScript({
            encounterResults: { '1_1': { stars: 2, difficulty: 1, completedAt: Date.now() } },
            adventureStatuses: { '1': 'COMPLETED', '2': 'AVAILABLE' },
        }));

        await page.goto('/chronicle/login');

        await page.fill('[data-testid="login-email-input"]', 'test@example.com');
        await page.fill('[data-testid="login-password-input"]', 'password123');
        await page.click('[data-testid="login-submit-btn"]', { force: true });

        await expect(page).toHaveURL(/\/chronicle\/login-success/, { timeout: 10000 });
        // Wait for re-initialization to complete (loading screen disappears)
        await expect(page.locator('[data-testid="login-success-continue-btn"]')).toBeVisible({ timeout: 15000 });
        await page.locator('[data-testid="login-success-continue-btn"]').click({ force: true });

        // Should redirect to the furthest unlocked adventure
        await expect(page).toHaveURL(/\/chronicle\/\d+/, { timeout: 10000 });
    });

    test('failed login shows error message', async ({ page }) => {
        await mockSupabaseAuthForLoginFailure(page);
        await page.goto('/chronicle/login');

        await page.fill('[data-testid="login-email-input"]', 'wrong@example.com');
        await page.fill('[data-testid="login-password-input"]', 'wrongpassword');
        await page.click('[data-testid="login-submit-btn"]', { force: true });

        await expect(page.locator('[data-testid="login-error-alert"]')).toBeVisible();
        // Should remain on login page
        await expect(page).toHaveURL(/\/chronicle\/login$/);
    });

    test('submit button is disabled while login is in progress', async ({ page }) => {
        await injectNoAnimationsScript(page);

        let resolveRoute: (() => void) | null = null;
        const routePromise = new Promise<void>((resolve) => { resolveRoute = resolve; });

        await page.route('**/auth/v1/**', async (route) => {
            const url = route.request().url();
            const method = route.request().method();

            if (method === 'POST' && url.includes('/token')) {
                // Hold the request to test loading state
                await routePromise;
                route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
                });
            } else {
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
            }
        });

        await page.goto('/chronicle/login');
        await page.fill('[data-testid="login-email-input"]', 'test@example.com');
        await page.fill('[data-testid="login-password-input"]', 'password123');
        await page.click('[data-testid="login-submit-btn"]', { force: true });

        // Button should be disabled during loading
        await expect(page.locator('[data-testid="login-submit-btn"]')).toBeDisabled();

        // Release the held route
        resolveRoute!();
    });
});
