import { vi } from 'vitest';

// 1. Mock Supabase Client
vi.mock('../services/supabase.service', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } }
            })),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
        })),
    }
}));

// 2. Mock Persistence Service
// We mock it globally so that store slices (which import it) don't trigger real logic.
vi.mock('../services/persistence.service', () => ({
    PersistenceService: {
        sync: vi.fn(() => Promise.resolve({ success: true })),
        pushState: vi.fn(() => Promise.resolve({ success: true })),
        pullState: vi.fn(() => Promise.resolve(null)),
    }
}));


