import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { handler } from "./index.ts";

/**
 * Mocks the Deno.env and global fetch to test the edge function 
 * without hitting any real external services or databases.
 */
Deno.test({
    name: "create-payment-intent handler - successful creation",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        // 1. Setup Mock Environment Variables
        const originalGet = Deno.env.get;
        const mockEnv: Record<string, string> = {
            'STRIPE_SECRET_KEY': 'sk_test_mock',
            'SUPABASE_URL': 'https://mock.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'service-role-key',
            'ALLOWED_ORIGINS': 'http://localhost:5173'
        };

        // Stub Deno.env.get
        Deno.env.get = (key: string) => mockEnv[key] || originalGet(key);

        // 2. Mock Global Fetch
        const originalFetch = globalThis.fetch;
        globalThis.fetch = async (input: string | URL | Request) => {
            const url = typeof input === 'string' ? input : input.toString();

            // Mock Supabase Auth verification
            if (url.includes('/auth/v1/user')) {
                return new Response(JSON.stringify({ user: { id: 'user-123', email: 'test@example.com' } }), { status: 200 });
            }

            // Mock Supabase Database calls
            if (url.includes('/rest/v1/player_entitlements')) {
                return new Response(JSON.stringify([]), { status: 200 });
            }
            if (url.includes('/rest/v1/content_pack_prices')) {
                return new Response(JSON.stringify({ amount_cents: 9900, currency: 'SEK' }), { status: 200 });
            }
            if (url.includes('/rest/v1/purchase_intents')) {
                // Support both SELECT (empty) and INSERT (success)
                return new Response(JSON.stringify([]), { status: 200 });
            }

            // Mock Stripe API
            if (url.includes('api.stripe.com/v1/payment_intents')) {
                return new Response(JSON.stringify({ id: 'pi_mock', client_secret: 'pi_mock_secret' }), { status: 200 });
            }

            return new Response(JSON.stringify({ error: `Not mocked: ${url}` }), { status: 404 });
        };

        try {
            // 3. Create Mock Request
            const req = new Request("http://localhost/create-payment-intent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer mock-jwt",
                    "Origin": "http://localhost:5173"
                },
                body: JSON.stringify({ contentPackId: "pack-1" }),
            });

            // 4. Invoke Handler
            const res = await handler(req);
            const data = await res.json();

            // 5. Assertions
            assertEquals(res.status, 200);
            assertEquals(data.clientSecret, "pi_mock_secret");
            assertEquals(data.displayPrice, "99 SEK");
            assertEquals(res.headers.get('Access-Control-Allow-Origin'), "http://localhost:5173");

        } finally {
            // 6. Restore global state
            globalThis.fetch = originalFetch;
            Deno.env.get = originalGet;
        }
    }
});

Deno.test({
    name: "create-payment-intent handler - fails if anonymous",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        const originalGet = Deno.env.get;
        const originalFetch = globalThis.fetch;

        Deno.env.get = (key: string) => ({
            'SUPABASE_URL': 'https://mock.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'service-role-key',
        }[key] || originalGet(key));

        globalThis.fetch = async (input: string | URL | Request) => {
            const url = typeof input === 'string' ? input : input.toString();

            if (url.includes('/auth/v1/user')) {
                return new Response(JSON.stringify({ user: { id: 'user-123', email: '' } }), { status: 200 });
            }
            if (url.includes('/rest/v1/content_pack_prices')) {
                return new Response(JSON.stringify({ amount_cents: 9900, currency: 'SEK' }), { status: 200 });
            }
            return new Response(JSON.stringify([]), { status: 200 });
        };

        try {
            const req = new Request("http://localhost/create-payment-intent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer mock-jwt",
                },
                body: JSON.stringify({ contentPackId: "pack-1" }),
            });

            const res = await handler(req);
            const data = await res.json();

            assertEquals(res.status, 400);
            assertEquals(data.error.includes("Account with a valid email is required for purchases"), true);

        } finally {
            globalThis.fetch = originalFetch;
            Deno.env.get = originalGet;
        }
    }
});

Deno.test({
    name: "create-payment-intent handler - returns 400 when contentPackId is missing",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        const originalGet = Deno.env.get;
        const originalFetch = globalThis.fetch;

        Deno.env.get = (key: string) => ({
            'SUPABASE_URL': 'https://mock.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'service-role-key',
        }[key] || originalGet(key));

        globalThis.fetch = async () => new Response(JSON.stringify([]), { status: 200 });

        try {
            const req = new Request("http://localhost/create-payment-intent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer mock-jwt",
                },
                body: JSON.stringify({}),
            });

            const res = await handler(req);
            const data = await res.json();

            assertEquals(res.status, 400);
            assertEquals(data.error, "Missing or invalid contentPackId");

        } finally {
            globalThis.fetch = originalFetch;
            Deno.env.get = originalGet;
        }
    }
});
