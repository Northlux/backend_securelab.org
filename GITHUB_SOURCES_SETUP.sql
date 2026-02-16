-- Create table for managing GitHub source repositories
CREATE TABLE IF NOT EXISTS github_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_url TEXT NOT NULL UNIQUE,
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  custom_description TEXT,
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active repos
CREATE INDEX IF NOT EXISTS idx_github_sources_active ON github_sources(is_active);

-- Seed with some example repos
INSERT INTO github_sources (repo_url, repo_owner, repo_name, custom_description, is_active) VALUES
  ('https://github.com/OWASP/owasp-mastermind', 'OWASP', 'owasp-mastermind', 'Open Web Application Security Project - Security best practices', true),
  ('https://github.com/projectdiscovery/nuclei', 'ProjectDiscovery', 'nuclei', 'Fast and customizable vulnerability scanner', true),
  ('https://github.com/aquasecurity/trivy', 'AquaSecurity', 'trivy', 'Vulnerability scanner for containers and dependencies', true),
  ('https://github.com/zaproxy/zaproxy', 'OWASP', 'zaproxy', 'Web application security scanner', true),
  ('https://github.com/securego/gosec', 'SecureGo', 'gosec', 'Go security checker', true),
  ('https://github.com/aquasecurity/grype', 'AquaSecurity', 'grype', 'Vulnerability scanner for container images and filesystems', true)
ON CONFLICT (repo_url) DO NOTHING;
