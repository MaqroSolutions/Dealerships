/* ────────────────────────────────────────────────────────────────
   Lead Management System Enhancements
   ──────────────────────────────────────────────────────────────── */

/* Ensure leads table has all required columns */
DO $$
BEGIN
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'phone'
  ) THEN
    ALTER TABLE leads ADD COLUMN phone TEXT;
  END IF;

  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'email'
  ) THEN
    ALTER TABLE leads ADD COLUMN email TEXT;
  END IF;

  -- Add message column if it doesn't exist (for notes)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'message'
  ) THEN
    ALTER TABLE leads ADD COLUMN message TEXT;
  END IF;

  -- Add car column if it doesn't exist (required field)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'car'
  ) THEN
    ALTER TABLE leads ADD COLUMN car TEXT NOT NULL DEFAULT 'Unknown';
  END IF;

  -- Add source column if it doesn't exist (required field)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'source'
  ) THEN
    ALTER TABLE leads ADD COLUMN source TEXT NOT NULL DEFAULT 'Website';
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'status'
  ) THEN
    ALTER TABLE leads ADD COLUMN status TEXT NOT NULL DEFAULT 'new';
  END IF;

  -- Add dealership_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'dealership_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE;
  END IF;

  -- Add user_id column if it doesn't exist (for assigned salesperson)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

/* Create index on phone number for faster lookups */
CREATE INDEX IF NOT EXISTS leads_phone_idx ON leads(phone);

/* Create index on user_id for salesperson assignments */
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads(user_id);

/* Update status constraint to include all valid statuses */
DO $$
BEGIN
  -- Drop existing check constraint if it exists
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
  
  -- Add new check constraint with all valid statuses
  ALTER TABLE leads ADD CONSTRAINT leads_status_check 
    CHECK (status IN ('new', 'warm', 'hot', 'follow-up', 'cold', 'deal_won', 'deal_lost'));
END $$;

/* Ensure user_profiles table has phone column */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone TEXT;
  END IF;
END $$;

/* Create index on user_profiles phone for faster lookups */
CREATE INDEX IF NOT EXISTS user_profiles_phone_idx ON user_profiles(phone);

/* Update RLS policies to ensure proper access control */
DROP POLICY IF EXISTS "Users can view leads in their dealership" ON leads;
DROP POLICY IF EXISTS "Users can insert leads for their dealership" ON leads;
DROP POLICY IF EXISTS "Users can update leads in their dealership" ON leads;
DROP POLICY IF EXISTS "Users can delete leads in their dealership" ON leads;

-- Create new dealership-based policies for leads
CREATE POLICY "Users can view leads in their dealership"
  ON leads
  FOR SELECT
  USING (dealership_id = (SELECT dealership_id FROM public.user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert leads for their dealership"
  ON leads
  FOR INSERT
  WITH CHECK (dealership_id = (SELECT dealership_id FROM public.user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update leads in their dealership"
  ON leads
  FOR UPDATE
  USING (dealership_id = (SELECT dealership_id FROM public.user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete leads in their dealership"
  ON leads
  FOR DELETE
  USING (dealership_id = (SELECT dealership_id FROM public.user_profiles WHERE user_id = auth.uid()));

/* Update conversation policies to ensure proper access */
DROP POLICY IF EXISTS "Users can manage conversations for their dealership leads" ON conversations;

CREATE POLICY "Users can manage conversations for their dealership leads"
  ON conversations
  FOR ALL
  USING (
    (SELECT dealership_id FROM leads WHERE id = conversations.lead_id) = 
    (SELECT dealership_id FROM public.user_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    (SELECT dealership_id FROM leads WHERE id = conversations.lead_id) = 
    (SELECT dealership_id FROM public.user_profiles WHERE user_id = auth.uid())
  );
