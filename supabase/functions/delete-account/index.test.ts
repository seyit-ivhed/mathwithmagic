import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { handler } from "./index.ts";

/**
 * Tests the delete-account edge function handler in isolation by mocking
 * Deno.env and global fetch so that no real Supabase calls are made.
 */

Deno.test({
    name: "delete-account handler - successfully deletes authenticated user",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        const originalGet = Deno.env.get;
        const originalFetch = globalThis.fetch;

        Deno.env.get = (key: string) => ({
            'SUPABASE_URL': 'https://mock.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'service-role-key',
            'CLIENT_URL': 'http://localhost:5173',
        }[key] || originalGet(key));

        globalThis.fetch = async (input: string | URL | Request) => {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

            // Mock admin delete user (must be checked before the getUser route)
            if (url.includes('/auth/v1/admin/users/')) {
                return new Response(JSON.stringify({ id: 'user-123', email: 'test@example.com' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Mock JWT verification
            if (url.includes('/auth/v1/user')) {
                return new Response(JSON.stringify({ id: 'user-123', email: 'test@example.com' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({ error: `Not mocked: ${url}` }), { status: 404 });
        };

        try {
            const req = new Request("http://localhost/delete-account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer mock-jwt",
                    "Origin": "http://localhost:5173",
                },
            });

            const res = await handler(req);
            const data = await res.json();

            assertEquals(res.status, 200);
            assertEquals(data.success, true);
            assertEquals(res.headers.get('Access-Control-Allow-Origin'), "http://localhost:5173");
        } finally {
            globalThis.fetch = originalFetch;
            Deno.env.get = originalGet;
        }
    }
});

Deno.test({
    name: "delete-account handler - returns 401 when Authorization header is missing",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        const originalGet = Deno.env.get;

        Deno.env.get = (key: string) => ({
            'SUPABASE_URL': 'https://mock.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'service-role-key',
        }[key] || originalGet(key));

        try {
            const req = new Request("http://localhost/delete-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const res = await handler(req);
            const data = await res.json();

            assertEquals(res.status, 401);
            assertEquals(data.error, "Missing Authorization header");
        } finally {
            Deno.env.get = originalGet;
        }
    }
});

Deno.test({
    name: "delete-account handler - returns 401 when JWT verification fails",
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
                // Simulate a failed auth verification (e.g. expired JWT)
                return new Response(JSON.stringify({ error: { message: 'Invalid JWT' } }), { status: 401 });
            }

            return new Response(JSON.stringify({ error: `Not mocked: ${url}` }), { status: 404 });
        };

        try {
            const req = new Request("http://localhost/delete-account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer invalid-jwt",
                },
            });

            const res = await handler(req);
            const data = await res.json();

            assertEquals(res.status, 401);
            assertEquals(data.error, "Unauthorized");
        } finally {
            globalThis.fetch = originalFetch;
            Deno.env.get = originalGet;
        }
    }
});

Deno.test({
    name: "delete-account handler - responds to CORS preflight",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        const originalGet = Deno.env.get;

        Deno.env.get = (key: string) => ({
            'SUPABASE_URL': 'https://mock.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'service-role-key',
            'CLIENT_URL': 'https://example.com',
        }[key] || originalGet(key));

        try {
            const req = new Request("http://localhost/delete-account", {
                method: "OPTIONS",
                headers: { "Origin": "https://example.com" },
            });

            const res = await handler(req);

            assertEquals(res.status, 200);
            assertEquals(res.headers.get('Access-Control-Allow-Methods'), "POST, OPTIONS");
        } finally {
            Deno.env.get = originalGet;
        }
    }
});
