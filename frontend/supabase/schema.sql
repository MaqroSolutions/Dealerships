-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  lead_id uuid NOT NULL,
  message text NOT NULL,
  sender text NOT NULL CHECK (sender = ANY (ARRAY['customer'::text, 'agent'::text, 'system'::text])),
  needs_approval boolean DEFAULT false,
  approved_by uuid,
  approved_at timestamp with time zone,
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT conversations_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id)
);
CREATE TABLE public.dealership_settings (
  dealership_id uuid NOT NULL,
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  CONSTRAINT dealership_settings_pkey PRIMARY KEY (dealership_id, setting_key),
  CONSTRAINT dealership_settings_key_fk FOREIGN KEY (setting_key) REFERENCES public.setting_definitions(setting_key),
  CONSTRAINT dealership_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
  CONSTRAINT dealership_settings_dealership_id_fkey FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id)
);
CREATE TABLE public.dealerships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  name text NOT NULL,
  location text,
  integration_config jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT dealerships_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  price text NOT NULL,
  mileage integer,
  description text,
  features text,
  dealership_id uuid NOT NULL,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'sold'::text, 'pending'::text])),
  condition text,
  CONSTRAINT inventory_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_dealership_id_fkey FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id)
);
CREATE TABLE public.invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  dealership_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'manager'::text, 'salesperson'::text])),
  invited_by uuid NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  used_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text, 'cancelled'::text])),
  token_hash text NOT NULL UNIQUE,
  CONSTRAINT invites_pkey PRIMARY KEY (id),
  CONSTRAINT invites_dealership_id_fkey FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id),
  CONSTRAINT invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id)
);
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  name text NOT NULL,
  car_interest text NOT NULL,
  source text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['new'::text, 'warm'::text, 'hot'::text, 'follow-up'::text, 'cold'::text, 'appointment_booked'::text, 'deal_won'::text, 'deal_lost'::text])),
  email text,
  phone text,
  message text,
  assigned_user_id uuid,
  dealership_id uuid NOT NULL,
  deal_value text,
  appointment_datetime timestamp with time zone,
  last_contact_at timestamp with time zone NOT NULL,
  max_price text,
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_dealership_id_fkey FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id),
  CONSTRAINT leads_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.password_reset_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  used_at timestamp with time zone,
  ip_address inet,
  user_agent text,
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.setting_definitions (
  setting_key text NOT NULL,
  scope text NOT NULL CHECK (scope = ANY (ARRAY['user'::text, 'dealership'::text, 'both'::text])),
  description text,
  default_value jsonb NOT NULL,
  is_sensitive boolean DEFAULT false,
  CONSTRAINT setting_definitions_pkey PRIMARY KEY (setting_key)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  phone text,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'manager'::text, 'salesperson'::text])),
  timezone text DEFAULT 'America/New_York'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  dealership_id uuid,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_profiles_dealership_id_fkey FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id)
);
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  dealership_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'manager'::text, 'salesperson'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, dealership_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_roles_dealership_id_fkey FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id)
);
CREATE TABLE public.user_settings (
  user_id uuid NOT NULL,
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  CONSTRAINT user_settings_pkey PRIMARY KEY (user_id, setting_key),
  CONSTRAINT user_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.vehicle_embeddings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL,
  formatted_text text NOT NULL,
  dealership_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  embedding USER-DEFINED,
  CONSTRAINT vehicle_embeddings_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_embeddings_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id),
  CONSTRAINT vehicle_embeddings_dealership_id_fkey FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id)
);