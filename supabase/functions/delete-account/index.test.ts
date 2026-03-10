import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createHandler } from "./index.ts";

/**
 * Tests the delete-account edge function handler in isolation.
 * A custom fetch is injected via createHandler() so the Supabase client never
 * makes real network calls regardless of how the npm package resolves fetch.
 */

const mockEnv: Record<string, string> = {
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    CLIENT_URL: 'http://localhost:5173',
};

function withMockEnv(fn: () => Promise<void>): () => Promise<void> {
    return async () => {
        const originalGet = Deno.env.get;
        Deno.env.get = (key: string) => mockEnv[key] ?? originalGet(key);
        try {
            await fn();
        } finally {
            Deno.env.get = originalGet;
        }
    };
}

function makeUrl(input: string | URL | Request): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;
    return (input as Request).url;
}

Deno.test({
    name: "delete-account handler - successfully deletes authenticated user",
    sanitizeResources: false,
    sanitizeOps: false,
    fn: withMockEnv(async () => {
        const mockFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
            const url = makeUrl(input);

            // Admin delete: return 204 No Content — processed before json() is called
            if (url.includes('/auth/v1/admin/users/')) {
                return new Response(null, { status: 204 });
            }

            // JWT verification: return user object
            if (url.includes('/auth/v1/user')) {
                return new Response(JSON.stringify({ id: 'user-123', email: 'test@example.com' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Password re-authentication via signInWithPassword (token endpoint)
            if (url.includes('/auth/v1/token') && init?.method === 'POST') {
                return new Response(JSON.stringify({
                    access_token: 'new-token',
                    token_type: 'bearer',
                    expires_in: 3600,
                    expires_at: Math.floor(Date.now() / 1000) + 3600,
                    refresh_token: 'refresh-token',
                    user: { id: 'user-123', email: 'test@example.com' },
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({ error: `Not mocked: ${url}` }), { status: 404 });
        };

        const handler = createHandler(mockFetch);

        const req = new Request("http://localhost/delete-account", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer mock-jwt",
                "Origin": "http://localhost:5173",
            },
            body: JSON.stringify({ password: "correct-password" }),
        });

        const res = await handler(req);
        const data = await res.json();

        assertEquals(res.status, 200);
        assertEquals(data.success, true);
        assertEquals(res.headers.get('Access-Control-Allow-Origin'), "http://localhost:5173");
    }),
});

Deno.test({
    name: "delete-account handler - returns 401 when Authorization header is missing",
    sanitizeResources: false,
    sanitizeOps: false,
    fn: withMockEnv(async () => {
        const handler = createHandler();

        const req = new Request("http://localhost/delete-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const res = await handler(req);
        const data = await res.json();

        assertEquals(res.status, 401);
        assertEquals(data.error, "Missing Authorization header");
    }),
});

Deno.test({
    name: "delete-account handler - returns 401 when JWT verification fails",
    sanitizeResources: false,
    sanitizeOps: false,
    fn: withMockEnv(async () => {
        const mockFetch = async (input: string | URL | Request): Promise<Response> => {
            const url = makeUrl(input);

            if (url.includes('/auth/v1/user')) {
                return new Response(JSON.stringify({ error: { message: 'Invalid JWT' } }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({ error: `Not mocked: ${url}` }), { status: 404 });
        };

        const handler = createHandler(mockFetch);

        const req = new Request("http://localhost/delete-account", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer invalid-jwt",
            },
            body: JSON.stringify({ password: "some-password" }),
        });

        const res = await handler(req);
        const data = await res.json();

        assertEquals(res.status, 401);
        assertEquals(data.error, "Unauthorized");
    }),
});

Deno.test({
    name: "delete-account handler - returns 400 when password is missing",
    sanitizeResources: false,
    sanitizeOps: false,
    fn: withMockEnv(async () => {
        const handler = createHandler();

        const req = new Request("http://localhost/delete-account", {
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
        assertEquals(data.error, "Password is required");
    }),
});

Deno.test({
    name: "delete-account handler - returns 401 when password is incorrect",
    sanitizeResources: false,
    sanitizeOps: false,
    fn: withMockEnv(async () => {
        const mockFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
            const url = makeUrl(input);

            if (url.includes('/auth/v1/user')) {
                return new Response(JSON.stringify({ id: 'user-123', email: 'test@example.com' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            if (url.includes('/auth/v1/token') && init?.method === 'POST') {
                return new Response(JSON.stringify({ error: { message: 'Invalid login credentials' } }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({ error: `Not mocked: ${url}` }), { status: 404 });
        };

        const handler = createHandler(mockFetch);

        const req = new Request("http://localhost/delete-account", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer mock-jwt",
            },
            body: JSON.stringify({ password: "wrong-password" }),
        });

        const res = await handler(req);
        const data = await res.json();

        assertEquals(res.status, 401);
        assertEquals(data.error, "Incorrect password");
    }),
});

Deno.test({
    name: "delete-account handler - responds to CORS preflight",
    sanitizeResources: false,
    sanitizeOps: false,
    fn: withMockEnv(async () => {
        const handler = createHandler();

        const req = new Request("http://localhost/delete-account", {
            method: "OPTIONS",
            headers: { "Origin": "https://example.com" },
        });

        // Override CLIENT_URL for this test
        const originalGet = Deno.env.get;
        Deno.env.get = (key: string) => key === 'CLIENT_URL' ? 'https://example.com' : (mockEnv[key] ?? originalGet(key));
        try {
            const res = await handler(req);
            assertEquals(res.status, 200);
            assertEquals(res.headers.get('Access-Control-Allow-Methods'), "POST, OPTIONS");
        } finally {
            Deno.env.get = originalGet;
        }
    }),
});
