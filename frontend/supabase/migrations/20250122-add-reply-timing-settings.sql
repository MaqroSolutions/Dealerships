-- Migration: Add Reply Timing Settings
-- Date: 2025-01-22
-- Description: Adds reply timing settings for dealerships to control AI response behavior

BEGIN;

-- Add reply timing setting definitions (idempotent)
INSERT INTO public.setting_definitions (setting_key, scope, description, default_value, is_sensitive) VALUES
  ('reply_timing_mode', 'dealership', 'Reply timing mode for AI responses', '"instant"', false)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.setting_definitions (setting_key, scope, description, default_value, is_sensitive) VALUES
  ('reply_delay_seconds', 'dealership', 'Custom delay in seconds for AI responses', '30', false)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.setting_definitions (setting_key, scope, description, default_value, is_sensitive) VALUES
  ('business_hours_start', 'dealership', 'Business hours start time (HH:MM format)', '"09:00"', false)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.setting_definitions (setting_key, scope, description, default_value, is_sensitive) VALUES
  ('business_hours_end', 'dealership', 'Business hours end time (HH:MM format)', '"17:00"', false)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.setting_definitions (setting_key, scope, description, default_value, is_sensitive) VALUES
  ('business_hours_delay_seconds', 'dealership', 'Delay in seconds during business hours', '60', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_dealership_settings_reply_timing 
  ON public.dealership_settings(dealership_id) 
  WHERE setting_key LIKE 'reply_%';

COMMIT;
