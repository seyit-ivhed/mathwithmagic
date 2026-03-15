-- Add cohort column to play_events for cohort and campaign analysis.
-- Nullable JSONB; existing rows will have NULL cohort (acceptable — these predate the feature).
-- No RLS changes needed — existing insert-only policy covers this new column.
ALTER TABLE public.play_events
    ADD COLUMN cohort JSONB;

COMMENT ON COLUMN public.play_events.cohort
    IS 'First-visit date (date only) and utm_campaign slug for cohort analysis. Not personal data — date buckets thousands of visitors; campaign is a slug only. Set once on first visit and never updated.';
