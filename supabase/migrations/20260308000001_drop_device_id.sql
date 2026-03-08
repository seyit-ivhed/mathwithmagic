-- Remove device_id column from player_profiles.
-- Device ID tracking was removed as it conflicted with privacy guidelines.
ALTER TABLE public.player_profiles DROP COLUMN IF EXISTS device_id;
