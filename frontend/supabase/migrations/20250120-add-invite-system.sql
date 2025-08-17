-- Migration: Add Invite System for Salesperson Onboarding
-- Date: 2025-01-20
-- Description: Adds invite system for dealership admins to invite salespeople
-- Compatible with both old (user_profiles.role) and new (roles table) role systems

BEGIN;

-- Create invites table for salesperson invitations
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  dealership_id uuid NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  role_name text NOT NULL CHECK (role_name IN ('owner', 'manager', 'salesperson', 'admin')),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  
  -- Ensure unique pending invites per email per dealership
  CONSTRAINT unique_pending_invite UNIQUE (dealership_id, email, status) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_dealership_email ON public.invites(dealership_id, email);
CREATE INDEX IF NOT EXISTS idx_invites_status_expires ON public.invites(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_invites_invited_by ON public.invites(invited_by);

-- Enable RLS
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invites - compatible with both role systems
CREATE POLICY "Users can view invites for their dealership"
  ON public.invites
  FOR SELECT
  USING (dealership_id = (SELECT dealership_id FROM public.user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Managers can create invites for their dealership"
  ON public.invites
  FOR INSERT
  WITH CHECK (
    dealership_id = (SELECT dealership_id FROM public.user_profiles WHERE user_id = auth.uid()) AND
    (
      -- Check new role system first
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
          AND ur.dealership_id = invites.dealership_id
          AND r.name IN ('owner', 'manager')
      )
      OR
      -- Fallback to old role system
      EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid() 
          AND up.dealership_id = invites.dealership_id
          AND up.role IN ('admin', 'owner', 'manager')
      )
    )
  );

CREATE POLICY "Managers can update invites for their dealership"
  ON public.invites
  FOR UPDATE
  USING (
    dealership_id = (SELECT dealership_id FROM public.user_profiles WHERE user_id = auth.uid()) AND
    (
      -- Check new role system first
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
          AND ur.dealership_id = invites.dealership_id
          AND r.name IN ('owner', 'manager')
      )
      OR
      -- Fallback to old role system
      EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid() 
          AND up.dealership_id = invites.dealership_id
          AND up.role IN ('admin', 'owner', 'manager')
      )
    )
  );

CREATE POLICY "Managers can delete invites for their dealership"
  ON public.invites
  FOR DELETE
  USING (
    dealership_id = (SELECT dealership_id FROM public.user_profiles WHERE user_id = auth.uid()) AND
    (
      -- Check new role system first
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
          AND ur.dealership_id = invites.dealership_id
          AND r.name IN ('owner', 'manager')
      )
      OR
      -- Fallback to old role system
      EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = auth.uid() 
          AND up.dealership_id = invites.dealership_id
          AND up.role IN ('admin', 'owner', 'manager')
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at column
CREATE TRIGGER update_invites_updated_at 
    BEFORE UPDATE ON public.invites 
    FOR EACH ROW 
    EXECUTE FUNCTION update_invites_updated_at();

-- Function to expire old invites
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void AS $$
BEGIN
  UPDATE public.invites 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ language 'plpgsql';

-- Helper function to get user role name (compatible with both systems)
CREATE OR REPLACE FUNCTION get_user_role_name(p_user_id uuid, p_dealership_id uuid)
RETURNS text AS $$
DECLARE
  role_name text;
BEGIN
  -- Try new role system first
  SELECT r.name INTO role_name
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id AND ur.dealership_id = p_dealership_id
  LIMIT 1;
  
  -- If not found, try old role system
  IF role_name IS NULL THEN
    SELECT up.role INTO role_name
    FROM public.user_profiles up
    WHERE up.user_id = p_user_id AND up.dealership_id = p_dealership_id
    LIMIT 1;
  END IF;
  
  -- Map old role names to new ones for consistency
  IF role_name = 'admin' THEN
    role_name := 'owner';
  END IF;
  
  RETURN role_name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
