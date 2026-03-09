-- Add product_update_consent column to player_profiles
-- This stores whether the parent/guardian opted in to receive game update emails
-- Legal basis: Art. 6(1)(a) GDPR — Consent (optional, pre-unchecked at account creation)

ALTER TABLE public.player_profiles
    ADD COLUMN IF NOT EXISTS product_update_consent BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.player_profiles.product_update_consent
    IS 'Whether the parent/guardian opted in to receive product update emails. GDPR Art. 6(1)(a) — Consent.';
