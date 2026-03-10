import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the supabase service before importing analyticsService
vi.mock('./supabase.service', () => ({
    supabase: {
        from: vi.fn().mockReturnValue({
            insert: vi.fn().mockResolvedValue({ error: null }),
        }),
    },
}));

// Mock crypto.randomUUID so session_id is predictable
const MOCK_UUID = 'test-session-uuid-1234';
vi.stubGlobal('crypto', { randomUUID: () => MOCK_UUID });

// Re-import after mocks are set up
const { analyticsService } = await import('./analytics.service');

// Reloads the analytics module with a given URL search string so that
// top-level constants (SESSION_ID, initAttribution) are re-evaluated
// against the new location. vi.mock registrations survive resetModules.
async function reloadWithSearch(search: string) {
    Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...window.location, search },
    });
    vi.resetModules();
    const { analyticsService: fresh } = await import('./analytics.service');
    return fresh;
}

describe('analyticsService', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { ...window.location, search: '' },
        });
        vi.unstubAllEnvs();
    });

    describe('getSessionId', () => {
        it('returns the module-level session UUID', () => {
            expect(analyticsService.getSessionId()).toBe(MOCK_UUID);
        });

        it('does not write session_id to localStorage', () => {
            analyticsService.getSessionId();
            expect(localStorage.getItem('session_id')).toBeNull();
        });

        it('does not write session_id to sessionStorage', () => {
            analyticsService.getSessionId();
            expect(sessionStorage.getItem('session_id')).toBeNull();
        });
    });

    describe('attribution', () => {
        it('captures utm params in sessionStorage when present in URL at load time', async () => {
            await reloadWithSearch('?utm_source=facebook&utm_campaign=kids-summer&utm_medium=cpc');
            const stored = JSON.parse(sessionStorage.getItem('attribution')!);
            expect(stored.source).toBe('facebook');
            expect(stored.campaign).toBe('kids-summer');
            expect(stored.medium).toBe('cpc');
        });

        it('does not write to sessionStorage when utm_source is absent', async () => {
            await reloadWithSearch('?fbclid=abc123&gclid=xyz789');
            expect(sessionStorage.getItem('attribution')).toBeNull();
        });

        it('handles malformed JSON in sessionStorage attribution gracefully', async () => {
            sessionStorage.setItem('attribution', 'not-valid-json{{{');
            // Should not throw when calling getAttribution
            const fresh = await reloadWithSearch('');
            // Call trackEvent which internally calls getAttribution → hits the catch block
            await fresh.trackEvent('test_event_malformed');
            expect(fresh).toBeDefined();
        });

        it('includes attribution in trackEvent payload when valid attribution is stored', async () => {
            const { supabase } = await import('./supabase.service');
            const insertMock = vi.fn().mockResolvedValue({ error: null });
            vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as unknown as ReturnType<typeof supabase.from>);

            // Set valid attribution in sessionStorage
            sessionStorage.setItem('attribution', JSON.stringify({ source: 'test', campaign: 'c1', medium: 'email' }));

            await analyticsService.trackEvent('event_with_attribution');

            expect(insertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    attribution: expect.objectContaining({ source: 'test' })
                })
            );
        });
    });

    describe('trackEvent', () => {
        it('inserts an event with session_id and event_type', async () => {
            const { supabase } = await import('./supabase.service');
            const insertMock = vi.fn().mockResolvedValue({ error: null });
            vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as unknown as ReturnType<typeof supabase.from>);

            await analyticsService.trackEvent('test_event', { foo: 'bar' });

            expect(supabase.from).toHaveBeenCalledWith('play_events');
            expect(insertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    session_id: MOCK_UUID,
                    event_type: 'test_event',
                    payload: { foo: 'bar' },
                })
            );
        });

        it('inserts null payload when no payload is provided', async () => {
            const { supabase } = await import('./supabase.service');
            const insertMock = vi.fn().mockResolvedValue({ error: null });
            vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as unknown as ReturnType<typeof supabase.from>);

            await analyticsService.trackEvent('session_started');

            expect(insertMock).toHaveBeenCalledWith(
                expect.objectContaining({ payload: null })
            );
        });

        it('silently swallows errors without throwing', async () => {
            const { supabase } = await import('./supabase.service');
            const insertMock = vi.fn().mockRejectedValue(new Error('Network error'));
            vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as unknown as ReturnType<typeof supabase.from>);

            await expect(analyticsService.trackEvent('test_event')).resolves.toBeUndefined();
        });

        it('pushes event to window.__analyticsEvents in dev mode', async () => {
            delete (window as Window).__analyticsEvents;

            await analyticsService.trackEvent('test_window_event', { key: 'val' });

            expect(window.__analyticsEvents).toHaveLength(1);
            expect(window.__analyticsEvents![0]).toMatchObject({
                event_type: 'test_window_event',
                payload: { key: 'val' },
            });
        });
    });

});
