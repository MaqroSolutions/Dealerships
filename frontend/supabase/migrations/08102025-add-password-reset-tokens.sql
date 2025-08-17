-- Migration script for adding password reset functionality
-- This script adds a password_reset_tokens table for secure password reset flow

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for performance and security
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_token_hash_idx ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx ON password_reset_tokens(expires_at);

-- Create a function to clean up expired tokens (runs daily)
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens 
  WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to clean up expired tokens (if pg_cron extension is available)
-- This is optional and can be set up manually in Supabase dashboard
-- SELECT cron.schedule('cleanup-password-reset-tokens', '0 2 * * *', 'SELECT cleanup_expired_password_reset_tokens();');

-- Add RLS (Row Level Security) policies
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own reset tokens (for security auditing)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'password_reset_tokens' AND policyname = 'Users can view their own reset tokens') THEN
        CREATE POLICY "Users can view their own reset tokens" ON password_reset_tokens
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Only allow system to insert/update reset tokens
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'password_reset_tokens' AND policyname = 'System can manage reset tokens') THEN
        CREATE POLICY "System can manage reset tokens" ON password_reset_tokens
          FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Create audit log table for password reset events
CREATE TABLE IF NOT EXISTS password_reset_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'request_reset', 'token_created', 'token_used', 'password_changed'
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  event_metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS password_reset_audit_log_user_id_idx ON password_reset_audit_log(user_id);
CREATE INDEX IF NOT EXISTS password_reset_audit_log_event_type_idx ON password_reset_audit_log(event_type);
CREATE INDEX IF NOT EXISTS password_reset_audit_log_created_at_idx ON password_reset_audit_log(created_at);

-- Add RLS to audit log
ALTER TABLE password_reset_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow system to manage audit logs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'password_reset_audit_log' AND policyname = 'System can manage audit logs') THEN
        CREATE POLICY "System can manage audit logs" ON password_reset_audit_log
          FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;
