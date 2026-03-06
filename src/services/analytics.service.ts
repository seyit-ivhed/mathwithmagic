import { supabase } from './supabase.service';

// Memory-only session ID — generated fresh per page load, never persisted
const SESSION_ID = crypto.randomUUID();

// Session start time for duration_ms calculation
const SESSION_START_MS = Date.now();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Read ref_session from URL params once (checkout page context)
const REF_SESSION_ID: string | null = new URLSearchParams(window.location.search).get('ref_session');

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

// Fire-and-forget via fetch keepalive — safe to call from beforeunload/visibilitychange
// because the browser keeps the request alive after the page is torn down.
function trackEventBeacon(
    eventType: string,
    payload?: Record<string, unknown>
): void {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    try {
        fetch(`${SUPABASE_URL}/rest/v1/play_events`, {
            method: 'POST',
            keepalive: true,
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                session_id: SESSION_ID,
                event_type: eventType,
                payload: payload ?? null,
                attribution: getAttribution(),
            }),
        }).catch(() => {
            // Silently swallow — analytics must never surface errors to players
        });
    } catch {
        // Silently swallow
    }
}

// Initialise attribution on module load
initAttribution();

export const analyticsService = {
    getSessionId: (): string => SESSION_ID,
    getRefSessionId: (): string | null => REF_SESSION_ID,
    getSessionDurationMs: (): number => Date.now() - SESSION_START_MS,
    trackEvent,
    trackEventBeacon,
};
