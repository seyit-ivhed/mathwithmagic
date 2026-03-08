import { supabase } from './supabase.service';

// Memory-only session ID — generated fresh per page load, never persisted.
// If the game is returning from the checkout flow, game_session restores the
// original session so all events share a single session_id.
const _urlParams = new URLSearchParams(window.location.search);
const SESSION_ID: string = _urlParams.get('game_session') ?? _urlParams.get('ref_session') ?? crypto.randomUUID();

// Remove game_session from the address bar after reading so it doesn't linger
if (_urlParams.has('game_session')) {
    _urlParams.delete('game_session');
    const newSearch = _urlParams.toString();
    history.replaceState(null, '', newSearch ? `?${newSearch}` : window.location.pathname);
}

// Read ref_session from URL params once (checkout page context)
const REF_SESSION_ID: string | null = _urlParams.get('ref_session');

function initAttribution(): void {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('utm_source');
    // Never capture fbclid, gclid, or other individual-level ad identifiers
    if (source) {
        sessionStorage.setItem(
            'attribution',
            JSON.stringify({
                source,
                campaign: params.get('utm_campaign'),
                medium: params.get('utm_medium'),
            })
        );
    }
}

function getAttribution(): Record<string, string | null> | null {
    const stored = sessionStorage.getItem('attribution');
    if (!stored) return null;
    try {
        return JSON.parse(stored) as Record<string, string | null>;
    } catch {
        return null;
    }
}

async function trackEvent(
    eventType: string,
    payload?: Record<string, unknown>
): Promise<void> {
    try {
        await supabase.from('play_events').insert({
            session_id: SESSION_ID,
            event_type: eventType,
            payload: payload ?? null,
            attribution: getAttribution(),
        });
    } catch {
        // Silently swallow — analytics must never surface errors to players
    }
}

// Initialise attribution on module load
initAttribution();

export const analyticsService = {
    getSessionId: (): string => SESSION_ID,
    getRefSessionId: (): string | null => REF_SESSION_ID,
    trackEvent,
};
