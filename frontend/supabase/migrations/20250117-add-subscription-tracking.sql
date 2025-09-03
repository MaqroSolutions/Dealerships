-- Migration: Add Subscription Tracking
-- Date: 2025-01-17
-- Description: Adds tables to track Stripe subscriptions and billing

BEGIN;

-- 1) SUBSCRIPTION PLANS TABLE
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id text NOT NULL UNIQUE,
  name text NOT NULL, -- 'Basic', 'Premium', 'Deluxe'
  description text,
  monthly_price_cents integer NOT NULL, -- Price in cents
  max_salespeople integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert the three subscription plans
INSERT INTO public.subscription_plans (stripe_product_id, name, description, monthly_price_cents, max_salespeople) VALUES
  ('prod_Sz5IHIEbqcYsXs', 'Basic', '1-3 Salespeople', 50000, 3),
  ('prod_Sz5IjUXqN7W5e4', 'Premium', 'Up to 10 Salespeople', 100000, 10),
  ('prod_Sz5HxTV9UWI1mH', 'Deluxe', '10+ Salespeople', 150000, NULL)
ON CONFLICT (stripe_product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  max_salespeople = EXCLUDED.max_salespeople;

-- 2) DEALERSHIP SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.dealership_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id uuid NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  subscription_plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete')),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  canceled_at timestamp with time zone
);

-- 3) SUBSCRIPTION EVENTS TABLE (for tracking all subscription changes)
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_subscription_id uuid NOT NULL REFERENCES public.dealership_subscriptions(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'created', 'updated', 'canceled', 'renewed', 'payment_failed', etc.
  stripe_event_id text UNIQUE,
  event_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dealership_subscriptions_dealership ON public.dealership_subscriptions(dealership_id);
CREATE INDEX IF NOT EXISTS idx_dealership_subscriptions_stripe ON public.dealership_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription ON public.subscription_events(dealership_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe ON public.subscription_events(stripe_event_id);

-- Add subscription_id to dealerships table
ALTER TABLE public.dealerships 
  ADD COLUMN IF NOT EXISTS current_subscription_id uuid REFERENCES public.dealership_subscriptions(id);

-- Timestamp update triggers
CREATE TRIGGER trg_touch_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_touch_dealership_subscriptions_updated_at
  BEFORE UPDATE ON public.dealership_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMIT;
