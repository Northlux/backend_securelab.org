-- Add unique constraints to prevent duplicate signals
-- Migration: Add unique constraints on signals table
-- Date: 2026-02-10

-- Add unique constraint on source_url to prevent duplicate signal imports
ALTER TABLE signals ADD CONSTRAINT signals_source_url_unique UNIQUE(source_url);

-- Create index on source_url for faster lookups during duplicate detection
CREATE INDEX IF NOT EXISTS idx_signals_source_url_for_duplicates ON signals(source_url) WHERE source_url IS NOT NULL;

-- Create index on cve_ids for faster CVE duplicate detection
-- Note: This is a partial index on array type - Supabase uses GIN index for arrays
CREATE INDEX IF NOT EXISTS idx_signals_cve_ids ON signals USING GIN(cve_ids);

-- Add constraint to ensure signals table integrity
ALTER TABLE signals
  ADD CONSTRAINT signals_title_not_empty CHECK (length(trim(title)) > 0),
  ADD CONSTRAINT signals_severity_valid CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  ADD CONSTRAINT signals_category_valid CHECK (signal_category IN ('vulnerability', 'breach', 'malware', 'threat_actor', 'exploit', 'ransomware', 'phishing', 'news')),
  ADD CONSTRAINT signals_confidence_valid CHECK (confidence_level >= 0 AND confidence_level <= 100);
