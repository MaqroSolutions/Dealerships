-- Cleanup script for password reset policies
-- Run this if you encounter policy conflicts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own reset tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "System can manage reset tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "System can manage audit logs" ON password_reset_audit_log;

-- Now you can run the main migration script safely
