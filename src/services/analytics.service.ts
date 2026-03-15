import { supabase } from './supabase.service';
import { usePlayerStore } from '../stores/player.store';

// Session ID persisted in sessionStorage so it survives page refreshes and
// navigations within the same tab (including game ↔ checkout). sessionStorage
// is tab-scoped and clears when the tab closes, making it the right primitive
// for a "session".
const SESSION_STORAGE_KEY = 'play_session_id';
const SESSION_ID: string =
    sessionStorage.getItem(SESSION_STORAGE_KEY) ??
    crypto.randomUUID();

sessionStorage.setItem(SESSION_STORAGE_KEY, SESSION_ID);

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
    if (!stored) {
        return null;
    }
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
    const { cohortDate, campaign } = usePlayerStore.getState();
    const record = {
        session_id: SESSION_ID,
        event_type: eventType,
        payload: payload ?? null,
        attribution: getAttribution(),
        cohort: {
            start_date: cohortDate,
            campaign,
        },
    };

    if (import.meta.env.DEV) {
        window.__analyticsEvents = window.__analyticsEvents ?? [];
        window.__analyticsEvents.push(record);
    }

    try {
        await supabase.from('play_events').insert(record);
    } catch {
        // Silently swallow — analytics must never surface errors to players
    }
}

// Initialise attribution on module load
initAttribution();

export const analyticsService = {
    getSessionId: (): string => SESSION_ID,
    trackEvent,
};
