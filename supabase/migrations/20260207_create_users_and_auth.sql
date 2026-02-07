-- Backend Authentication and Users Schema
-- Created: 2026-02-07
-- Manages user profiles, roles, and authentication metadata

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles in the system
CREATE TYPE user_role AS ENUM (
  'admin',        -- Full system access
  'user',         -- Regular user with subscription
  'guest'         -- Limited access, no subscription
);

-- Status of user accounts
CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'suspended',
  'pending_verification'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Extended user profile (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile information
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,

  -- Account status
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'pending_verification',

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,

  CONSTRAINT email_lowercase CHECK (email = LOWER(email))
);

-- User email verification
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- User password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- User sessions for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  session_token TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address INET,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log for security events
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,

  ip_address INET,
  user_agent TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all user profiles
CREATE POLICY "Admins can view all profiles"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only service_role can modify user profiles (from backend)
CREATE POLICY "Only backend can modify users"
  ON users FOR ALL
  USING (false)
  WITH CHECK (false);

-- Users can view their own email verifications
CREATE POLICY "Users can view own email verifications"
  ON email_verifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can view their own password reset tokens
CREATE POLICY "Users can view own reset tokens"
  ON password_reset_tokens FOR SELECT
  USING (user_id = auth.uid());

-- Users can view own sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (user_id = auth.uid());

-- Users can view own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update user updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.update_user_updated_at();

-- Clean up expired tokens regularly (can be called manually or by cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verifications WHERE expires_at < now();
  DELETE FROM password_reset_tokens WHERE expires_at < now() AND used_at IS NOT NULL;
  DELETE FROM user_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Extended user profiles linked to auth.users';
COMMENT ON TABLE email_verifications IS 'Email verification tokens for new user signups';
COMMENT ON TABLE password_reset_tokens IS 'Password reset tokens for account recovery';
COMMENT ON TABLE user_sessions IS 'Active user sessions for tracking and management';
COMMENT ON TABLE audit_logs IS 'Security audit trail of all user actions';
