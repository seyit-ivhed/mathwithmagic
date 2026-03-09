import { test, expect } from '@playwright/test';
import { interceptSupabaseAuth, expectEventFired } from './helpers';

test.describe('Encounter (Battle)', () => {
    test.beforeEach(async ({ page }) => {
        await interceptSupabaseAuth(page);
    });

    test('encounter page loads with party unit cards and monster cards', async ({ page }) => {
        await page.goto('/encounter/1/1');
        // Wait for at least one unit card to appear (encounter initializes on mount)
        await expect(page.locator('[data-testid^="unit-card-"]').first()).toBeVisible();
        await expectEventFired(page, 'encounter_started');
    });

    test('party unit cards are rendered for adventure 1 first encounter', async ({ page }) => {
        await page.goto('/encounter/1/1');
        // The default party includes companions — at least one party card should be present
        const unitCards = page.locator('[data-testid^="unit-card-"]');
        await expect(unitCards.first()).toBeVisible();
        const count = await unitCards.count();
        expect(count).toBeGreaterThan(0);
    });

    test('back-to-map button navigates back to the adventure map', async ({ page }) => {
        await page.goto('/encounter/1/1');
        await expect(page.locator('[data-testid^="unit-card-"]').first()).toBeVisible();
        await page.click('[data-testid="back-to-map-btn"]', { force: true });
        await expect(page).toHaveURL(/\/map\/1/);
    });
});
