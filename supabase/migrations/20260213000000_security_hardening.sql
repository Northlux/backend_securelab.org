-- Supabase Security Hardening
-- Date: 2026-02-13
-- Purpose: Add missing tables, fix RLS policies, and enhance security

-- ============================================================================
-- ALTER ENUMS (Add missing roles)
-- ============================================================================

-- Add 'analyst' role to user_role enum
ALTER TYPE user_role ADD VALUE 'analyst' BEFORE 'user';

-- ============================================================================
-- CREATE MISSING TABLES
-- ============================================================================

-- Billing history for financial tracking
CREATE TABLE IF NOT EXISTS billing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Transaction details
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  transaction_type TEXT NOT NULL, -- 'charge', 'refund', 'adjustment'
  status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'

  -- Invoice reference
  invoice_id TEXT,
  invoice_url TEXT,

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT amount_positive CHECK (amount >= 0),
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('charge', 'refund', 'adjustment')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed'))
);

-- Upgrade requests from users
CREATE TABLE IF NOT EXISTS upgrade_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_tier_id UUID REFERENCES subscription_tiers(id) ON DELETE SET NULL,
  to_tier_id UUID NOT NULL REFERENCES subscription_tiers(id) ON DELETE CASCADE,

  -- Request status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'

  -- Admin notes
  admin_notes TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamps
  requested_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  effective_at TIMESTAMPTZ,

  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

-- Rate limit counters (for distributed rate limiting)
CREATE TABLE IF NOT EXISTS rate_limit_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Rate limit key format: "operation:user_id" or "operation:ip"
  operation_key TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (operation_key, window_start)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX idx_billing_history_subscription_id ON billing_history(subscription_id);
CREATE INDEX idx_billing_history_created_at ON billing_history(created_at);
CREATE INDEX idx_billing_history_status ON billing_history(status);

CREATE INDEX idx_upgrade_requests_user_id ON upgrade_requests(user_id);
CREATE INDEX idx_upgrade_requests_status ON upgrade_requests(status);
CREATE INDEX idx_upgrade_requests_created_at ON upgrade_requests(requested_at);

CREATE INDEX idx_rate_limit_counters_operation_key ON rate_limit_counters(operation_key);
CREATE INDEX idx_rate_limit_counters_user_id ON rate_limit_counters(user_id);
CREATE INDEX idx_rate_limit_counters_window ON rate_limit_counters(window_start, window_end);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_counters ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Billing History RLS
-- Users can view their own billing history
CREATE POLICY "Users can view own billing history" ON billing_history FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all billing history
CREATE POLICY "Admins can view all billing history" ON billing_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Upgrade Requests RLS
-- Users can view their own requests
CREATE POLICY "Users can view own upgrade requests" ON upgrade_requests FOR SELECT
  USING (user_id = auth.uid());

-- Analysts and admins can view all requests
CREATE POLICY "Analysts can view all upgrade requests" ON upgrade_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
  );

-- Rate Limit Counters (mostly for backend use)
-- Service role only
CREATE POLICY "Service role manage rate limits" ON rate_limit_counters
  USING (auth.role() = 'service_role');

-- ============================================================================
-- FIX RLS HELPER FUNCTIONS (Database-backed, not JWT-based)
-- ============================================================================

-- Create function to get user role from database
-- This replaces JWT-based role checks
DROP FUNCTION IF EXISTS get_user_role(UUID) CASCADE;
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role FROM users WHERE id = user_id LIMIT 1;
  RETURN COALESCE(v_role, 'user');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user is admin (database-backed)
DROP FUNCTION IF EXISTS is_admin() CASCADE;
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user is analyst or admin
DROP FUNCTION IF EXISTS is_analyst_or_admin() CASCADE;
CREATE OR REPLACE FUNCTION is_analyst_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'analyst')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Verify user is authenticated
DROP FUNCTION IF EXISTS is_authenticated() CASCADE;
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- IMPROVE EXISTING RLS POLICIES (Use new functions)
-- ============================================================================

-- Drop old policies that check JWT
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
CREATE POLICY "Admins can view all profiles" ON users FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- CREATE HELPER FUNCTION FOR OPERATION LOGGING
-- ============================================================================

-- Log user action with security context
CREATE OR REPLACE FUNCTION log_user_action(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    created_at
  )
  VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata,
    now()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEANUP FUNCTION
-- ============================================================================

-- Clean up expired rate limit counters
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_counters WHERE window_end < now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE billing_history IS 'Financial transaction history for billing and invoicing';
COMMENT ON TABLE upgrade_requests IS 'User requests to upgrade subscription tiers';
COMMENT ON TABLE rate_limit_counters IS 'Distributed rate limiting counter storage';

COMMENT ON FUNCTION get_user_role(UUID) IS 'Get user role from database (not JWT claims)';
COMMENT ON FUNCTION is_admin() IS 'Check if current user is admin (database-backed)';
COMMENT ON FUNCTION is_analyst_or_admin() IS 'Check if current user is analyst or admin (database-backed)';
COMMENT ON FUNCTION log_user_action(UUID, TEXT, TEXT, TEXT, JSONB) IS 'Log user action to audit trail';
