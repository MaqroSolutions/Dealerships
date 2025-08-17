-- Migration: Add Settings System
-- Date: 2025-01-17
-- Description: Adds hierarchical settings system with roles and user preferences

BEGIN;

-- 1) ROLES (3 simple system roles)
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
    CHECK (name IN ('owner','manager','salesperson')),
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- Insert system roles
INSERT INTO public.roles (name, description) VALUES
  ('owner', 'Full dealership control and settings management'),
  ('manager', 'Manage people, leads, and some dealership settings'),
  ('salesperson', 'Base salesperson access with assigned leads')
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description;

-- 2) USER ROLES (scoped per dealership, ONE role per user per dealership)
-- Future-proof: allows users to have different roles at different dealerships
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dealership_id uuid NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id),
  created_at timestamp with time zone DEFAULT now(),
  -- enforce a single role per user per dealership
  PRIMARY KEY (user_id, dealership_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_dealership_role ON public.user_roles(dealership_id, role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

-- 3) SETTING DEFINITIONS (light validation metadata)
CREATE TABLE IF NOT EXISTS public.setting_definitions (
  key text PRIMARY KEY,
  data_type text NOT NULL CHECK (data_type IN ('string','number','boolean','json')),
  description text,
  default_value jsonb,
  allowed_values jsonb, -- e.g. ["light","dark"]
  is_dealership_level boolean DEFAULT true,
  is_user_level boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 4) DEALERSHIP SETTINGS
CREATE TABLE IF NOT EXISTS public.dealership_settings (
  dealership_id uuid NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  setting_key text NOT NULL REFERENCES public.setting_definitions(key),
  setting_value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (dealership_id, setting_key)
);

-- 5) USER SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_key text NOT NULL REFERENCES public.setting_definitions(key),
  setting_value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (user_id, setting_key)
);

-- Indexes for settings queries
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_dealer_settings_dealer ON public.dealership_settings(dealership_id);

-- 6) ADD INTEGRATION CONFIG TO DEALERSHIPS
ALTER TABLE public.dealerships 
  ADD COLUMN IF NOT EXISTS integration_config jsonb DEFAULT '{}'::jsonb;

-- ---- TIMESTAMP TOUCH TRIGGERS ----
CREATE OR REPLACE FUNCTION public.touch_updated_at() 
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_touch_dealership_settings ON public.dealership_settings;
CREATE TRIGGER trg_touch_dealership_settings
  BEFORE UPDATE ON public.dealership_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_user_settings ON public.user_settings;
CREATE TRIGGER trg_touch_user_settings
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---- VALUE VALIDATION (type + allowed_values) ----
CREATE OR REPLACE FUNCTION public.validate_setting_value(p_key text, p_value jsonb)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  t text;
  allowed jsonb;
BEGIN
  SELECT data_type, allowed_values INTO t, allowed
  FROM public.setting_definitions WHERE key = p_key;

  IF t IS NULL THEN
    RETURN false; -- unknown key
  END IF;

  -- type checks
  IF t = 'boolean' AND jsonb_typeof(p_value) <> 'boolean' THEN RETURN false; END IF;
  IF t = 'number'  AND jsonb_typeof(p_value) <> 'number'  THEN RETURN false; END IF;
  IF t = 'string'  AND jsonb_typeof(p_value) <> 'string'  THEN RETURN false; END IF;
  IF t = 'json'    AND jsonb_typeof(p_value) IS NULL      THEN RETURN false; END IF;

  -- allowed_values (for string/number enums)
  IF allowed IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(allowed) av
      WHERE av = p_value
    ) THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END$$;

CREATE OR REPLACE FUNCTION public.check_settings_before_write() 
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT public.validate_setting_value(NEW.setting_key, NEW.setting_value) THEN
    RAISE EXCEPTION 'Invalid value for setting %', NEW.setting_key;
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_validate_dealership_settings ON public.dealership_settings;
CREATE TRIGGER trg_validate_dealership_settings
  BEFORE INSERT OR UPDATE ON public.dealership_settings
  FOR EACH ROW EXECUTE FUNCTION public.check_settings_before_write();

DROP TRIGGER IF EXISTS trg_validate_user_settings ON public.user_settings;
CREATE TRIGGER trg_validate_user_settings
  BEFORE INSERT OR UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.check_settings_before_write();

-- ---- EFFECTIVE SETTING RESOLUTION ----
-- Returns user → dealership → default in that order.
CREATE OR REPLACE FUNCTION public.get_setting(p_user uuid, p_key text)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  WITH up AS (
    SELECT dealership_id FROM public.user_profiles WHERE user_id = p_user LIMIT 1
  )
  SELECT COALESCE(
    (SELECT us.setting_value FROM public.user_settings us
      WHERE us.user_id = p_user AND us.setting_key = p_key),
    (SELECT ds.setting_value FROM public.dealership_settings ds
      JOIN up ON up.dealership_id = ds.dealership_id
      WHERE ds.setting_key = p_key),
    (SELECT sd.default_value FROM public.setting_definitions sd
      WHERE sd.key = p_key)
  );
$$;

-- ---- HELPER FUNCTION FOR FUTURE MULTI-DEALERSHIP SUPPORT ----
-- Get all dealerships where user has 'owner' role (future-proof)
CREATE OR REPLACE FUNCTION public.get_user_owned_dealerships(p_user uuid)
RETURNS TABLE(dealership_id uuid, dealership_name text) 
LANGUAGE sql STABLE AS $$
  SELECT ur.dealership_id, d.name
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  JOIN public.dealerships d ON d.id = ur.dealership_id
  WHERE ur.user_id = p_user AND r.name = 'owner';
$$;

-- ---- RLS POLICIES ----
-- Enable RLS
ALTER TABLE public.user_roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealership_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setting_definitions ENABLE ROW LEVEL SECURITY;

-- USER SETTINGS: users can read/write their own
CREATE POLICY "user_settings_read_own"
  ON public.user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_settings_write_own"
  ON public.user_settings FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_update_own"
  ON public.user_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DEALERSHIP SETTINGS: visible to members of the dealership
CREATE POLICY "dealer_settings_read_members"
  ON public.dealership_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.dealership_id = dealership_id
    )
  );

-- Only owners/managers can write dealership settings
CREATE POLICY "dealer_settings_write_manager_plus"
  ON public.dealership_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.dealership_id = dealership_id
        AND r.name IN ('owner','manager')
    )
  );

CREATE POLICY "dealer_settings_update_manager_plus"
  ON public.dealership_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.dealership_id = dealership_id
        AND r.name IN ('owner','manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.dealership_id = dealership_id
        AND r.name IN ('owner','manager')
    )
  );

-- USER ROLES: only owners can assign roles within their dealership
CREATE POLICY "user_roles_read_membership"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.dealership_id = user_roles.dealership_id
    )
  );

CREATE POLICY "user_roles_write_owner_only"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.dealership_id = user_roles.dealership_id
        AND r.name = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.dealership_id = user_roles.dealership_id
        AND r.name = 'owner'
    )
  );

-- SETTING DEFINITIONS: readable by all authenticated users
CREATE POLICY "setting_definitions_read_all"
  ON public.setting_definitions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ---- MIGRATE EXISTING USER ROLES ----
-- Convert existing text-based roles to new role system
DO $$
DECLARE
  user_record RECORD;
  role_record RECORD;
BEGIN
  -- Only migrate if user_profiles.role column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    
    FOR user_record IN 
      SELECT user_id, dealership_id, role 
      FROM public.user_profiles 
      WHERE dealership_id IS NOT NULL AND role IS NOT NULL
    LOOP
      -- Map old role to new role
      SELECT id INTO role_record FROM public.roles 
      WHERE name = CASE 
        WHEN user_record.role = 'admin' THEN 'owner'
        WHEN user_record.role = 'salesperson' THEN 'salesperson'
        WHEN user_record.role = 'manager' THEN 'manager'
        ELSE 'salesperson'
      END;
      
      -- Insert role assignment (ignore conflicts)
      INSERT INTO public.user_roles (user_id, dealership_id, role_id)
      VALUES (user_record.user_id, user_record.dealership_id, role_record.id)
      ON CONFLICT (user_id, dealership_id) DO NOTHING;
    END LOOP;
    
  END IF;
END$$;

-- ---- SEED DEFAULT SETTINGS ----
INSERT INTO public.setting_definitions (key, data_type, description, default_value, allowed_values, is_dealership_level, is_user_level) VALUES
  ('timezone', 'string', 'IANA timezone', '"America/New_York"'::jsonb, null, true, true),
  ('business_hours', 'json', 'Open/close hours per weekday', '{"mon":[["09:00","18:00"]],"tue":[["09:00","18:00"]],"wed":[["09:00","18:00"]],"thu":[["09:00","18:00"]],"fri":[["09:00","18:00"]],"sat":[["09:00","17:00"]],"sun":[]}'::jsonb, null, true, false),
  ('notify_new_leads', 'boolean', 'Push notifications for new leads', 'true'::jsonb, null, true, true),
  ('reply_window_minutes', 'number', 'Max minutes for auto-reply', '15'::jsonb, null, true, true),
  ('theme', 'string', 'UI theme preference', '"light"'::jsonb, '["light","dark"]'::jsonb, false, true),
  ('ai_persona', 'string', 'AI agent personality', '"professional"'::jsonb, '["friendly","professional","casual"]'::jsonb, true, false),
  ('ai_dealership_name', 'string', 'How AI refers to dealership', '"our dealership"'::jsonb, null, true, false),
  ('ai_signature', 'string', 'Custom signature for AI responses', null, null, true, true),
  ('auto_respond_enabled', 'boolean', 'Enable automatic responses', 'true'::jsonb, null, true, false),
  ('max_discount_percent', 'number', 'Maximum discount percentage allowed', '10'::jsonb, null, true, false),
  ('dashboard_leads_per_page', 'number', 'Leads displayed per page', '25'::jsonb, null, false, true),
  ('notifications_email', 'boolean', 'Email notification preferences', 'true'::jsonb, null, false, true),
  ('notifications_sms', 'boolean', 'SMS notification preferences', 'false'::jsonb, null, false, true),
  ('notifications_push', 'boolean', 'Push notification preferences', 'true'::jsonb, null, false, true)
ON CONFLICT (key) DO NOTHING;

COMMIT;