-- Intel sources table
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL CHECK (source_type IN ('rss', 'api', 'scraper', 'manual')),
  url TEXT,
  is_active BOOLEAN DEFAULT true,
  update_frequency TEXT DEFAULT 'hourly' CHECK (update_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  priority INTEGER DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Intel signals table
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  full_content TEXT,
  signal_category TEXT DEFAULT 'news' CHECK (signal_category IN (
    'vulnerability', 'threat_actor', 'malware', 'breach', 'advisory',
    'exploit', 'ransomware', 'phishing', 'news'
  )),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  confidence_level INTEGER DEFAULT 50 CHECK (confidence_level >= 0 AND confidence_level <= 100),
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  source_url TEXT,
  source_date TIMESTAMPTZ,
  cve_ids TEXT[],
  threat_actors TEXT[],
  target_industries TEXT[],
  target_regions TEXT[],
  affected_products TEXT[],
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Signal-tags junction table
CREATE TABLE IF NOT EXISTS signal_tags (
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (signal_id, tag_id)
);

-- Ingestion logs table
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  signals_found INTEGER DEFAULT 0,
  signals_imported INTEGER DEFAULT 0,
  signals_skipped INTEGER DEFAULT 0,
  signals_errored INTEGER DEFAULT 0,
  error_message TEXT,
  import_metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_signals_category ON signals(signal_category);
CREATE INDEX idx_signals_severity ON signals(severity);
CREATE INDEX idx_signals_source ON signals(source_id);
CREATE INDEX idx_signals_created ON signals(created_at DESC);
CREATE INDEX idx_signals_source_url ON signals(source_url);
CREATE INDEX idx_sources_active ON sources(is_active);
CREATE INDEX idx_ingestion_logs_source ON ingestion_logs(source_id);
CREATE INDEX idx_ingestion_logs_status ON ingestion_logs(status);

-- Enable Row Level Security
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only access)
-- Sources policies
CREATE POLICY "Admin users can view sources"
  ON sources FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can insert sources"
  ON sources FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can update sources"
  ON sources FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can delete sources"
  ON sources FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- Signals policies (same pattern)
CREATE POLICY "Admin users can view signals"
  ON signals FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can insert signals"
  ON signals FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can update signals"
  ON signals FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can delete signals"
  ON signals FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- Tags policies
CREATE POLICY "Admin users can view tags"
  ON tags FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can insert tags"
  ON tags FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can update tags"
  ON tags FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can delete tags"
  ON tags FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- Signal_tags policies
CREATE POLICY "Admin users can view signal_tags"
  ON signal_tags FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can insert signal_tags"
  ON signal_tags FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can delete signal_tags"
  ON signal_tags FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- Ingestion logs policies
CREATE POLICY "Admin users can view ingestion_logs"
  ON ingestion_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can insert ingestion_logs"
  ON ingestion_logs FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin users can delete ingestion_logs"
  ON ingestion_logs FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- Seed initial data
INSERT INTO sources (name, source_type, url, is_active, update_frequency, priority) VALUES
  ('Manual Entry', 'manual', NULL, true, 'manual', 100),
  ('BleepingComputer RSS', 'rss', 'https://www.bleepingcomputer.com/feed/', true, 'hourly', 90),
  ('The Hacker News RSS', 'rss', 'https://feeds.feedburner.com/TheHackersNews', true, 'hourly', 85),
  ('CISA Alerts', 'api', 'https://www.cisa.gov/cybersecurity-advisories/all.xml', true, 'daily', 95);

INSERT INTO tags (name, color) VALUES
  ('Critical', '#dc2626'),
  ('High Priority', '#ea580c'),
  ('Ransomware', '#a21caf'),
  ('Zero-Day', '#dc2626'),
  ('APT', '#7c3aed'),
  ('Phishing', '#0891b2'),
  ('Malware', '#be123c'),
  ('CVE', '#0d9488');
