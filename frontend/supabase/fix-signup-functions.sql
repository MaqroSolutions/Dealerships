-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS handle_initial_setup(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS handle_initial_setup(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS handle_sales_signup(UUID, TEXT, TEXT, TEXT);

-- Create the dealership signup function
CREATE OR REPLACE FUNCTION handle_initial_setup(
  p_user_id UUID,
  p_dealership_name TEXT,
  p_full_name TEXT
) RETURNS JSON AS $$
DECLARE
  v_dealership_id UUID;
  v_result JSON;
BEGIN
  -- Create dealership
  INSERT INTO dealerships (name, location)
  VALUES (p_dealership_name, '')
  RETURNING id INTO v_dealership_id;

  -- Create user profile
  INSERT INTO user_profiles (user_id, dealership_id, full_name, role, timezone)
  VALUES (p_user_id, v_dealership_id, p_full_name, 'owner', 'America/New_York');

  -- Create user role
  INSERT INTO user_roles (user_id, dealership_id, role)
  VALUES (p_user_id, v_dealership_id, 'owner');

  v_result := json_build_object(
    'success', true,
    'dealership_id', v_dealership_id,
    'message', 'Setup completed successfully'
  );
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  v_result := json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Setup failed'
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the sales signup function
CREATE OR REPLACE FUNCTION handle_sales_signup(
  p_user_id UUID,
  p_invite_token TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_invite RECORD;
  v_result JSON;
BEGIN
  -- Get invite details
  SELECT * INTO v_invite
  FROM invites
  WHERE token_hash = p_invite_token AND status = 'pending' AND expires_at > NOW();

  IF NOT FOUND THEN
    v_result := json_build_object(
      'success', false, 
      'error', 'Invalid or expired invite token', 
      'message', 'Setup failed'
    );
    RETURN v_result;
  END IF;

  -- Create user profile
  INSERT INTO user_profiles (user_id, dealership_id, full_name, phone, role, timezone)
  VALUES (p_user_id, v_invite.dealership_id, p_full_name, p_phone, v_invite.role, 'America/New_York');

  -- Create user role
  INSERT INTO user_roles (user_id, dealership_id, role)
  VALUES (p_user_id, v_invite.dealership_id, v_invite.role);

  -- Mark invite as accepted
  UPDATE invites
  SET status = 'accepted', used_at = NOW()
  WHERE id = v_invite.id;

  v_result := json_build_object(
    'success', true, 
    'dealership_id', v_invite.dealership_id, 
    'role', v_invite.role, 
    'message', 'Sales signup completed successfully'
  );
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  v_result := json_build_object(
    'success', false, 
    'error', SQLERRM, 
    'message', 'Setup failed'
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_initial_setup(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_sales_signup(UUID, TEXT, TEXT, TEXT) TO authenticated;
