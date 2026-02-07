-- Create subscription tiers table
CREATE TABLE subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  price_monthly numeric(10,2),
  price_yearly numeric(10,2),
  app_access text[] NOT NULL DEFAULT '{}',
  features jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES subscription_tiers(id),
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create audit logs table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text,
  resource_id text,
  app_name text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: subscription_tiers (public read)
CREATE POLICY "Public read subscription_tiers" ON subscription_tiers FOR SELECT
  USING (true);

-- RLS Policies: subscriptions (users view own)
CREATE POLICY "Users view own subscription" ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manage subscriptions" ON subscriptions
  USING (auth.role() = 'service_role');

-- RLS Policies: audit_logs (admins only)
CREATE POLICY "Service role manage audit logs" ON audit_logs
  USING (auth.role() = 'service_role');

-- Seed subscription tiers
INSERT INTO subscription_tiers (name, display_name, description, price_monthly, price_yearly, app_access, features)
VALUES
  ('free', 'Free Tier', 'Access to web.securelab.org only', NULL, NULL, '{}', '["web_access"]'),
  ('basic', 'Basic Plan', 'Access to Intel threat intelligence', 9.99, 99.99, '{"intel"}', '["intel_access", "basic_filters"]'),
  ('premium', 'Premium Plan', 'Full platform access with threat tracking', 29.99, 299.99, '{"intel", "threattrails"}', '["intel_access", "threattrails_access", "api_access", "advanced_filters", "export_data"]'),
  ('enterprise', 'Enterprise Plan', 'White-label solution with priority support', 99.99, 999.99, '{"intel", "threattrails"}', '["all_access", "priority_support", "custom_integrations", "api_access", "white_label"]');

-- Create function to check user access
CREATE OR REPLACE FUNCTION check_user_app_access(user_id uuid, app_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions s
    JOIN subscription_tiers st ON s.tier_id = st.id
    WHERE s.user_id = user_id
    AND s.status = 'active'
    AND st.app_access @> ARRAY[app_name]
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log audit action
CREATE OR REPLACE FUNCTION log_audit_action(
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id text,
  p_app_name text,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, app_name, metadata)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_app_name, p_metadata)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
