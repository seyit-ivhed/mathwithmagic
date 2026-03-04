import type { Page } from '@playwright/test';

const GAME_STORE_KEY = 'playtolearn-game-store';
const SUPABASE_AUTH_STORAGE_KEY = 'sb-localhost-auth-token';

const ANONYMOUS_USER = {
    id: 'test-anonymous-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: '',
    is_anonymous: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    app_metadata: { provider: 'anonymous' },
    user_metadata: {},
};

const PERMANENT_USER = {
    id: 'test-permanent-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    is_anonymous: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    app_metadata: { provider: 'email' },
    user_metadata: {},
};

/**
 * Intercepts Supabase auth API calls so tests work without a live Supabase instance.
 * Even with a fake VITE_SUPABASE_URL, some refreshSession calls may fire if a
 * stored session exists. This interception ensures those calls return cleanly.
 */
export async function interceptSupabaseAuth(page: Page): Promise<void> {
    await page.route('**/auth/v1/**', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: { session: null, user: null }, error: null }),
        });
    });
}

/**
 * Seeds the Zustand game store in localStorage before the page loads.
 * Call this via page.addInitScript() so it runs before any JS.
 */
export function buildGameStateScript(partial: {
    encounterResults?: Record<string, { stars: number; difficulty: number; completedAt: number }>;
    adventureStatuses?: Record<string, string>;
    activeEncounterDifficulty?: number;
}): string {
    const state = {
        activeParty: ['lyra', 'kaelen', 'torvin'],
        encounterResults: partial.encounterResults ?? {},
        activeEncounterDifficulty: partial.activeEncounterDifficulty ?? 1,
        companionStats: {},
        adventureStatuses: partial.adventureStatuses ?? { '1': 'AVAILABLE' },
    };
    return `localStorage.setItem('${GAME_STORE_KEY}', JSON.stringify({ state: ${JSON.stringify(state)}, version: 0 }));`;
}

/**
 * Seeds a fake anonymous Supabase session in localStorage before the page loads.
 * This makes useAuth return an anonymous user without requiring a live Supabase instance.
 */
export function buildAnonymousSessionScript(): string {
    const session = {
        access_token: 'fake-anonymous-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: 9999999999,
        refresh_token: 'fake-anonymous-refresh-token',
        user: ANONYMOUS_USER,
    };
    return `localStorage.setItem('${SUPABASE_AUTH_STORAGE_KEY}', JSON.stringify(${JSON.stringify(session)}));`;
}

/**
 * Seeds a fake permanent (non-anonymous) Supabase session in localStorage before the page loads.
 * This makes useAuth return a signed-in, non-anonymous user without requiring a live Supabase instance.
 */
export function buildPermanentSessionScript(): string {
    const session = {
        access_token: 'fake-permanent-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: 9999999999,
        refresh_token: 'fake-permanent-refresh-token',
        user: PERMANENT_USER,
    };
    return `localStorage.setItem('${SUPABASE_AUTH_STORAGE_KEY}', JSON.stringify(${JSON.stringify(session)}));`;
}

/**
 * Intercepts Supabase API calls needed for the account creation (anonymous → permanent) flow.
 * Mocks updateUser, profile upsert, and the refresh token call.
 * After the refresh token call, subsequent auth checks will see a non-anonymous user.
 */
export async function interceptAccountConversion(page: Page): Promise<void> {
    const permanentSession = {
        access_token: 'fake-permanent-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: 9999999999,
        refresh_token: 'fake-permanent-refresh-token',
        user: PERMANENT_USER,
    };

    // Mock updateUser (PUT /auth/v1/user) to succeed
    await page.route('**/auth/v1/user', (route) => {
        if (route.request().method() === 'PUT') {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(PERMANENT_USER),
            });
        } else {
            route.continue();
        }
    });

    // Mock the player_profiles upsert to succeed
    await page.route('**/rest/v1/player_profiles*', (route) => {
        route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    // Mock the refresh token call (POST /auth/v1/token) to return a permanent user session.
    // This is what triggers useAuth to update and show the payment step.
    await page.route('**/auth/v1/token*', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(permanentSession),
        });
    });
}

/**
 * Intercepts the create-payment-intent Supabase Edge Function.
 * Pass a response object to control what the mock returns.
 */
export async function interceptCreatePaymentIntent(
    page: Page,
    response: { clientSecret?: string; alreadyOwned?: boolean; error?: boolean }
): Promise<void> {
    await page.route('**/functions/v1/create-payment-intent', (route) => {
        if (response.error) {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Internal server error' }),
            });
        } else {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    clientSecret: response.clientSecret,
                    alreadyOwned: response.alreadyOwned,
                }),
            });
        }
    });
}
