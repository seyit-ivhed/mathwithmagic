import { assertEquals, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { verifyAndGrantEntitlement, handler } from "./index.ts";
import { SupabaseClient } from 'npm:@supabase/supabase-js@^2.0.0';
import Stripe from 'npm:stripe@^14.0.0';


Deno.test({
    name: "verify-payment - grants entitlement when Stripe confirms succeeded",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        let entitlementUpserted = false;
        let intentStatusUpdated = false;

        const mockSupabaseAdmin = {
            from: (table: string) => {
                if (table === 'purchase_intents') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => ({
                                    eq: () => ({
                                        order: () => ({
                                            limit: () => ({
                                                maybeSingle: async () => ({
                                                    data: { id: 'intent-123', stripe_payment_intent_id: 'pi_test_123' },
                                                    error: null,
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        }),
                        update: () => {
                            intentStatusUpdated = true;
                            return {
                                eq: () => ({ data: null, error: null })
                            };
                        }
                    };
                }
                if (table === 'player_entitlements') {
                    return {
                        upsert: async () => {
                            entitlementUpserted = true;
                            return { error: null };
                        }
                    };
                }
                return {};
            }
        };

        const mockStripe = {
            paymentIntents: {
                retrieve: async () => ({ status: 'succeeded' })
            }
        };

        const result = await verifyAndGrantEntitlement(
            mockStripe as unknown as Stripe,
            mockSupabaseAdmin as unknown as SupabaseClient,
            'player-123',
            'premium_base',
        );

        assertEquals(result.verified, true);
        assertEquals(entitlementUpserted, true);
        assertEquals(intentStatusUpdated, true);
    }
});


Deno.test({
    name: "verify-payment - returns false when Stripe says still processing",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        const mockSupabaseAdmin = {
            from: (table: string) => {
                if (table === 'purchase_intents') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => ({
                                    eq: () => ({
                                        order: () => ({
                                            limit: () => ({
                                                maybeSingle: async () => ({
                                                    data: { id: 'intent-456', stripe_payment_intent_id: 'pi_test_456' },
                                                    error: null,
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    };
                }
                return {};
            }
        };

        const mockStripe = {
            paymentIntents: {
                retrieve: async () => ({ status: 'processing' })
            }
        };

        const result = await verifyAndGrantEntitlement(
            mockStripe as unknown as Stripe,
            mockSupabaseAdmin as unknown as SupabaseClient,
            'player-123',
            'premium_base',
        );

        assertEquals(result.verified, false);
        assertEquals(result.status, 'processing');
    }
});


Deno.test({
    name: "verify-payment - returns verified true when entitlement already exists (no pending intent)",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        const mockSupabaseAdmin = {
            from: (table: string) => {
                if (table === 'purchase_intents') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => ({
                                    eq: () => ({
                                        order: () => ({
                                            limit: () => ({
                                                maybeSingle: async () => ({
                                                    data: null,
                                                    error: null,
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    };
                }
                if (table === 'player_entitlements') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => ({
                                    maybeSingle: async () => ({
                                        data: { id: 'entitlement-789' },
                                        error: null,
                                    })
                                })
                            })
                        })
                    };
                }
                return {};
            }
        };

        const mockStripe = {} as Stripe;

        const result = await verifyAndGrantEntitlement(
            mockStripe,
            mockSupabaseAdmin as unknown as SupabaseClient,
            'player-123',
            'premium_base',
        );

        assertEquals(result.verified, true);
    }
});


Deno.test({
    name: "verify-payment - returns false when no pending intent and no entitlement",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        const mockSupabaseAdmin = {
            from: (table: string) => {
                if (table === 'purchase_intents') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => ({
                                    eq: () => ({
                                        order: () => ({
                                            limit: () => ({
                                                maybeSingle: async () => ({
                                                    data: null,
                                                    error: null,
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    };
                }
                if (table === 'player_entitlements') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => ({
                                    maybeSingle: async () => ({
                                        data: null,
                                        error: null,
                                    })
                                })
                            })
                        })
                    };
                }
                return {};
            }
        };

        const mockStripe = {} as Stripe;

        const result = await verifyAndGrantEntitlement(
            mockStripe,
            mockSupabaseAdmin as unknown as SupabaseClient,
            'player-123',
            'premium_base',
        );

        assertEquals(result.verified, false);
        assertEquals(result.status, 'no_pending_intent');
    }
});


Deno.test({
    name: "verify-payment - throws when entitlement upsert fails",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        const mockSupabaseAdmin = {
            from: (table: string) => {
                if (table === 'purchase_intents') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => ({
                                    eq: () => ({
                                        order: () => ({
                                            limit: () => ({
                                                maybeSingle: async () => ({
                                                    data: { id: 'intent-999', stripe_payment_intent_id: 'pi_test_999' },
                                                    error: null,
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        }),
                        update: () => ({
                            eq: () => ({ data: null, error: null })
                        })
                    };
                }
                if (table === 'player_entitlements') {
                    return {
                        upsert: async () => ({ error: { message: 'DB constraint violation' } })
                    };
                }
                return {};
            }
        };

        const mockStripe = {
            paymentIntents: {
                retrieve: async () => ({ status: 'succeeded' })
            }
        };

        await assertRejects(
            () => verifyAndGrantEntitlement(
                mockStripe as unknown as Stripe,
                mockSupabaseAdmin as unknown as SupabaseClient,
                'player-123',
                'premium_base',
            ),
            Error,
            'Database error during entitlement grant',
        );
    }
});


Deno.test({
    name: "verify-payment handler - returns 401 when Authorization header is missing",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        const originalGet = Deno.env.get;
        Deno.env.get = (key: string) => ({
            'STRIPE_SECRET_KEY': 'sk_test_mock',
            'SUPABASE_URL': 'https://mock.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'service-role-key',
            'ALLOWED_ORIGINS': 'http://localhost:5173',
        }[key] || originalGet(key));

        try {
            const req = new Request('http://localhost/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'http://localhost:5173',
                },
                body: JSON.stringify({ contentPackId: 'premium_base' }),
            });

            const res = await handler(req);
            const data = await res.json();

            assertEquals(res.status, 401);
            assertEquals(data.error, 'Missing Authorization header');
        } finally {
            Deno.env.get = originalGet;
        }
    }
});


Deno.test({
    name: "verify-payment handler - returns 400 when contentPackId is missing",
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
        const originalGet = Deno.env.get;
        Deno.env.get = (key: string) => ({
            'STRIPE_SECRET_KEY': 'sk_test_mock',
            'SUPABASE_URL': 'https://mock.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'service-role-key',
            'ALLOWED_ORIGINS': 'http://localhost:5173',
        }[key] || originalGet(key));

        try {
            const req = new Request('http://localhost/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer token',
                    'Origin': 'http://localhost:5173',
                },
                body: JSON.stringify({}),
            });

            const res = await handler(req);
            const data = await res.json();

            assertEquals(res.status, 400);
            assertEquals(data.error, 'Missing or invalid contentPackId');
        } finally {
            Deno.env.get = originalGet;
        }
    }
});
