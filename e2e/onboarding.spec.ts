import { test, expect } from '@playwright/test';
import { interceptSupabaseAuth, expectEventFired } from './helpers';

test.describe('Onboarding Flow', () => {
    test.beforeEach(async ({ page }) => {
        await interceptSupabaseAuth(page);
    });

    test('new player lands on cover page with start and login buttons', async ({ page }) => {
        await page.goto('/chronicle/cover');
        await expect(page.locator('[data-testid="cover-start-btn"]')).toBeVisible();
        await expect(page.locator('[data-testid="cover-login-btn"]')).toBeVisible();
    });

    test('new player can navigate from cover to difficulty selection', async ({ page }) => {
        await page.goto('/chronicle/cover');
        await expect(page.locator('[data-testid="cover-start-btn"]')).toBeVisible();
        await page.click('[data-testid="cover-start-btn"]', { force: true });
        await expect(page).toHaveURL(/\/chronicle\/difficulty/);
        await expect(page.locator('[data-testid="difficulty-option-1"]')).toBeVisible();
        await expect(page.locator('[data-testid="difficulty-option-2"]')).toBeVisible();
        await expect(page.locator('[data-testid="difficulty-option-3"]')).toBeVisible();
        await expectEventFired(page, 'cover_start_clicked', { has_progress: false, destination: 'difficulty' });
    });

    test('player can select a difficulty and reach the first adventure chapter', async ({ page }) => {
        await page.goto('/chronicle/difficulty');
        await expect(page.locator('[data-testid="difficulty-option-1"]')).toBeVisible();
        await page.click('[data-testid="difficulty-option-1"]', { force: true });
        await expect(page).toHaveURL(/\/chronicle\/1/);
        await expect(page.locator('[data-testid="chapter-page"]').first()).toBeVisible();
        await expect(page.locator('[data-testid="begin-chapter-btn"]')).toBeVisible();
        await expectEventFired(page, 'initial_difficulty_selected', { difficulty: 1 });
    });

    test('root path redirects to chronicle', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL(/\/chronicle/);
        await expectEventFired(page, 'session_started');
    });
});
