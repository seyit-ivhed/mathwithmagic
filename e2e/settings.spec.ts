import { test, expect } from '@playwright/test';
import { interceptSupabaseAuth, buildAuthenticatedSessionScript } from './helpers';

test.describe('Settings', () => {
    test.beforeEach(async ({ page }) => {
        await interceptSupabaseAuth(page);
    });

    test('settings button is visible on the chronicle page', async ({ page }) => {
        await page.goto('/chronicle/cover');
        await expect(page.locator('[data-testid="settings-button"]')).toBeVisible();
    });

    test('clicking the settings button opens the settings modal', async ({ page }) => {
        await page.goto('/chronicle/cover');
        await expect(page.locator('[data-testid="settings-button"]')).toBeVisible();
        await page.click('[data-testid="settings-button"]', { force: true });
        await expect(page.locator('[data-testid="settings-menu"]')).toBeVisible();
    });

    test('settings button is accessible from the adventure map', async ({ page }) => {
        await page.goto('/map/1');
        await expect(page.locator('[data-testid="map-node-1_1"]')).toBeVisible();
        await expect(page.locator('[data-testid="settings-button"]')).toBeVisible();
        await page.click('[data-testid="settings-button"]', { force: true });
        await expect(page.locator('[data-testid="settings-menu"]')).toBeVisible();
    });

    test('settings button is accessible from the encounter page', async ({ page }) => {
        await page.goto('/encounter/1/1');
        await expect(page.locator('[data-testid^="unit-card-"]').first()).toBeVisible();
        await expect(page.locator('[data-testid="settings-button"]')).toBeVisible();
        await page.click('[data-testid="settings-button"]', { force: true });
        await expect(page.locator('[data-testid="settings-menu"]')).toBeVisible();
    });
});

test.describe('Settings - authenticated user', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(buildAuthenticatedSessionScript());
        await page.route('**/auth/v1/**', (route) => {
            const url = route.request().url();
            const method = route.request().method();
            if (method === 'POST' && url.includes('/token')) {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        access_token: 'test-auth-access-token',
                        token_type: 'bearer',
                        expires_in: 3600,
                        expires_at: 9999999999,
                        refresh_token: 'test-auth-refresh-token',
                        user: {
                            id: 'test-user-id',
                            email: 'test@example.com',
                            is_anonymous: false,
                        },
                    }),
                });
            } else if (method === 'GET' && url.includes('/user')) {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'test-user-id',
                        email: 'test@example.com',
                        is_anonymous: false,
                    }),
                });
            } else {
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
            }
        });
        await page.route('**/rest/v1/player_profiles**', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ id: 'test-user-id', product_update_consent: false }]),
            });
        });
        await page.route('**/rest/v1/game_states**', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
        });
        await page.route('**/rest/v1/player_entitlements**', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
        });
    });

    test('Account button appears in settings for authenticated users', async ({ page }) => {
        await page.goto('/chronicle/cover');
        await page.click('[data-testid="settings-button"]', { force: true });
        await expect(page.locator('[data-testid="settings-menu"]')).toBeVisible();
        await expect(page.locator('[data-testid="settings-account-btn"]')).toBeVisible();
    });

    test('clicking Account button navigates to account page', async ({ page }) => {
        await page.goto('/chronicle/cover');
        await page.click('[data-testid="settings-button"]', { force: true });
        await expect(page.locator('[data-testid="settings-account-btn"]')).toBeVisible();
        await page.click('[data-testid="settings-account-btn"]', { force: true });
        await expect(page.locator('[data-testid="account-page"]')).toBeVisible();
    });
});
