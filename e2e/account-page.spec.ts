import { test, expect } from '@playwright/test';
import {
    buildAuthenticatedSessionScript,
    mockSupabaseAuthForCheckout,
    mockMainAppRestApis,
    expectEventFired,
} from './helpers';

async function setupAuthenticatedMainApp(page: Parameters<typeof mockSupabaseAuthForCheckout>[0]) {
    await page.addInitScript(buildAuthenticatedSessionScript());
    await mockSupabaseAuthForCheckout(page);
    await mockMainAppRestApis(page);
}

test.describe('Account Page', () => {
    test('sends password reset email and shows success message', async ({ page }) => {
        await setupAuthenticatedMainApp(page);
        await page.goto('/chronicle/cover');

        await page.click('[data-testid="settings-button"]', { force: true });
        await expect(page.locator('[data-testid="settings-menu"]')).toBeVisible();
        await expect(page.locator('[data-testid="change-password-settings"]')).toBeVisible();

        await page.click('[data-testid="change-password-btn"]', { force: true });

        await expect(page.locator('[data-testid="change-password-success"]')).toBeVisible({ timeout: 5000 });
        await expectEventFired(page, 'password_reset_email_sent');
    });

    test('successful deletion redirects to chronicle', async ({ page }) => {
        await setupAuthenticatedMainApp(page);
        await page.route('**/functions/v1/delete-account**', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true }),
            });
        });
        await page.goto('/chronicle/cover');

        await page.click('[data-testid="settings-button"]', { force: true });
        await expect(page.locator('[data-testid="settings-menu"]')).toBeVisible();
        await expect(page.locator('[data-testid="delete-account-settings"]')).toBeVisible();

        await page.click('[data-testid="delete-account-btn"]', { force: true });
        await expect(page.locator('[data-testid="delete-account-confirmation"]')).toBeVisible();

        await page.click('[data-testid="delete-account-confirm-btn"]', { force: true });

        await expect(page).toHaveURL(/\/chronicle/, { timeout: 10000 });
        await expectEventFired(page, 'account_deleted');
    });
});
