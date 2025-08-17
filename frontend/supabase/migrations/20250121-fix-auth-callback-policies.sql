-- Migration to fix RLS policies for auth callback
-- This allows the auth callback to create dealerships and user profiles during signup

-- Enable RLS on dealerships if not already enabled
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;

-- Drop existing dealership policies
DROP POLICY IF EXISTS "Users can view their own dealership" ON dealerships;

-- Create comprehensive dealership policies
CREATE POLICY "Users can view their own dealership"
  ON dealerships
  FOR SELECT
  USING (
    id = (SELECT dealership_id FROM public.user_profiles WHERE user_id = auth.uid())
    OR 
    -- Allow viewing if user is creating their first dealership (no profile yet)
    NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid())
  );

-- Allow users to create dealerships (for initial signup)
CREATE POLICY "Users can create dealerships"
  ON dealerships
  FOR INSERT
  WITH CHECK (true); -- Allow all inserts for now, we'll validate in application logic

-- Allow users to update their own dealership
CREATE POLICY "Users can update their own dealership"
  ON dealerships
  FOR UPDATE
  USING (id = (SELECT dealership_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- Enable RLS on user_profiles if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing user_profiles policies
DROP POLICY IF EXISTS "Users can view profiles in their dealership" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

-- Create comprehensive user_profiles policies
CREATE POLICY "Users can view profiles in their dealership"
  ON user_profiles
  FOR SELECT
  USING (
    dealership_id = (SELECT dealership_id FROM public.user_profiles WHERE user_id = auth.uid())
    OR 
    -- Allow viewing if user is creating their first profile (no profile yet)
    NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid())
  );

-- Allow users to create their own profile (for initial signup)
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON user_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to handle initial setup that bypasses RLS
CREATE OR REPLACE FUNCTION handle_initial_setup(
  p_user_id UUID,
  p_dealership_name TEXT,
  p_full_name TEXT
) RETURNS JSON AS $$
DECLARE
  v_dealership_id UUID;
  v_result JSON;
BEGIN
  -- Use SECURITY DEFINER to bypass RLS
  -- Create dealership
  INSERT INTO dealerships (name, location)
  VALUES (p_dealership_name, '')
  RETURNING id INTO v_dealership_id;
  
  -- Create user profile
  INSERT INTO user_profiles (user_id, dealership_id, full_name, role, timezone)
  VALUES (p_user_id, v_dealership_id, p_full_name, 'owner', 'America/New_York');
  
  -- Return success result
  v_result := json_build_object(
    'success', true,
    'dealership_id', v_dealership_id,
    'message', 'Setup completed successfully'
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Return error result
  v_result := json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Setup failed'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION handle_initial_setup(UUID, TEXT, TEXT) TO authenticated;
