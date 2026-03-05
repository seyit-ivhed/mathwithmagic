import type { Page } from '@playwright/test';

const GAME_STORE_KEY = 'playtolearn-game-store';

// ---------------------------------------------------------------------------
// Checkout mock fixtures
// ---------------------------------------------------------------------------

const ANON_USER = {
    id: 'test-anon-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: null,
    is_anonymous: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    app_metadata: { provider: 'anonymous' },
    user_metadata: {},
};

const ANON_SESSION = {
    access_token: 'test-anon-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 9999999999,
    refresh_token: 'test-anon-refresh-token',
    user: ANON_USER,
};

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

// Stripe mock script – intercept js.stripe.com and return this instead of the real SDK.
// The mock implements just enough of the Stripe API surface for checkout tests to pass.
const STRIPE_MOCK_SCRIPT = `
window.Stripe = function(key, options) {
    var mockElement = {
        mount: function() {},
        unmount: function() {},
        destroy: function() {},
        on: function() { return this; },
        off: function() { return this; },
        update: function() {},
        collapse: function() {},
        focus: function() {},
    };
    var mockElements = {
        create: function() { return mockElement; },
        getElement: function() { return mockElement; },
        fetchUpdates: async function() { return {}; },
        submit: async function() { return { error: null }; },
        update: function() {},
    };
    return {
        elements: function() { return mockElements; },
        // Required by @stripe/react-stripe-js v5 isStripe() validation:
        createToken: async function() { return { token: null, error: null }; },
        createPaymentMethod: async function() { return { paymentMethod: null, error: null }; },
        confirmCardPayment: async function() { return { paymentIntent: null, error: null }; },
        confirmPayment: async function() {
            return {
                paymentIntent: { id: 'pi_test_mock', status: 'succeeded' },
                error: null,
            };
        },
        retrievePaymentIntent: async function() {
            return { paymentIntent: { id: 'pi_test_mock', status: 'succeeded' } };
        },
    };
};
// @stripe/stripe-js v3+ calls window.Stripe.registerAppInfo() as a static method
// before instantiating. Without this no-op, the loadStripe() promise rejects.
window.Stripe.registerAppInfo = function() {};
`;

/**
 * Injects a <style> that disables all CSS animations and transitions.
 * Prevents Playwright's "element not stable" errors on animated buttons.
 * Must be called before page.goto().
 */
async function injectAnimationDisablingCSS(page: Page): Promise<void> {
    await page.addInitScript(() => {
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
 * Intercepts Supabase auth API calls so tests work without a live Supabase instance.
 * Even with a fake VITE_SUPABASE_URL, some refreshSession calls may fire if a
 * stored session exists. This interception ensures those calls return cleanly.
 */
export async function interceptSupabaseAuth(page: Page): Promise<void> {
    await injectAnimationDisablingCSS(page);
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

// ---------------------------------------------------------------------------
// Checkout mock helpers
// ---------------------------------------------------------------------------

/**
 * Seeds localStorage with a valid authenticated Supabase session before the page loads.
 * The Supabase client reads this on init, avoiding the need for real auth API calls.
 * Must be used with page.addInitScript() BEFORE page.goto().
 *
 * The storage key follows Supabase JS v2's convention:
 *   sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token
 * For VITE_SUPABASE_URL=http://localhost:54321 this resolves to sb-localhost-auth-token.
 */
export function buildAuthenticatedSessionScript(): string {
    // Supabase JS v2 storage key: sb-${hostname.split('.')[0]}-auth-token
    // Seed both common local dev keys to handle whichever VITE_SUPABASE_URL is active:
    //   http://localhost:54321  → sb-localhost-auth-token
    //   http://127.0.0.1:54321 → sb-127-auth-token
    const sessionStr = JSON.stringify(JSON.stringify(AUTH_SESSION));
    return [
        `localStorage.setItem('sb-localhost-auth-token', ${sessionStr});`,
        `localStorage.setItem('sb-127-auth-token', ${sessionStr});`,
    ].join('\n');
}

/**
 * Intercepts js.stripe.com and returns a minimal Stripe mock.
 * Prevents any real Stripe network calls. The mock's confirmPayment()
 * always resolves with a succeeded paymentIntent.
 */
export async function mockStripe(page: Page): Promise<void> {
    await page.route('**/js.stripe.com/**', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/javascript',
            body: STRIPE_MOCK_SCRIPT,
        });
    });
}

/**
 * Intercepts the create-payment-intent edge function.
 * Defaults to returning a fake clientSecret; pass { alreadyOwned: true } to
 * simulate a user who has already purchased the content pack.
 */
export async function mockPaymentIntent(
    page: Page,
    response: { clientSecret?: string; alreadyOwned?: boolean } = { clientSecret: 'pi_test_123_secret_test456' },
): Promise<void> {
    await page.route('**/functions/v1/create-payment-intent**', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(response),
        });
    });
}

/**
 * Intercepts Supabase REST API calls used during the checkout flow.
 * - player_profiles: returns success for the upsert in account conversion
 * - player_entitlements: returns an existing entitlement so verifyEntitlement()
 *   resolves on the first poll (no 2-second delay loops)
 */
export async function mockSupabaseRestApis(page: Page): Promise<void> {
    await page.route('**/rest/v1/player_profiles**', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'test-user-id' }]),
        });
    });

    await page.route('**/rest/v1/player_entitlements**', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'test-entitlement', content_pack_id: 'premium_base' }]),
        });
    });
}

/**
 * Intercepts all Supabase auth endpoints for the anonymous → authenticated
 * account conversion flow:
 *   - POST /signup  → anonymous session
 *   - PUT  /user    → updated user (success)
 *   - POST /token   → authenticated session (after refreshSession)
 *   - GET  /user    → authenticated user (for getUser() calls)
 */
export async function mockSupabaseAuthForConversion(page: Page): Promise<void> {
    await injectAnimationDisablingCSS(page);
    await page.route('**/auth/v1/**', async (route) => {
        const url = route.request().url();
        const method = route.request().method();

        if (method === 'POST' && url.includes('/signup')) {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ANON_SESSION) });
        } else if (method === 'POST' && url.includes('/token')) {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTH_SESSION) });
        } else if (method === 'PUT' && url.includes('/user')) {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTH_USER) });
        } else if (method === 'GET' && url.includes('/user')) {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTH_USER) });
        } else {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
        }
    });
}

/**
 * Like mockSupabaseAuthForConversion but PUT /user returns a 422 to simulate
 * the "email already registered" error path.
 */
export async function mockSupabaseAuthForAlreadyRegistered(page: Page): Promise<void> {
    await injectAnimationDisablingCSS(page);
    await page.route('**/auth/v1/**', async (route) => {
        const url = route.request().url();
        const method = route.request().method();

        if (method === 'POST' && url.includes('/signup')) {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ANON_SESSION) });
        } else if (method === 'PUT' && url.includes('/user')) {
            route.fulfill({
                status: 422,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Email already registered', status: 422 }),
            });
        } else {
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
        }
    });
}

/**
 * Intercepts Supabase auth endpoints for the already-authenticated checkout flow.
 * Used alongside buildAuthenticatedSessionScript() (which seeds localStorage).
 * - POST /token → authenticated session (token refresh on init)
 * - GET  /user  → authenticated user (for getUser() calls in CheckoutForm)
 */
export async function mockSupabaseAuthForCheckout(page: Page): Promise<void> {
    await injectAnimationDisablingCSS(page);
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
}
