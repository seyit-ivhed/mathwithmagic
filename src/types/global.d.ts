declare global {
    interface Window {
        __analyticsEvents?: Array<{
            session_id: string;
            event_type: string;
            payload: Record<string, unknown> | null;
            attribution: Record<string, string | null> | null;
        }>;
    }
}

export {};
