-- Disable RLS on Intel Management Tables for Development
-- Note: Security is handled at the application layer via requireAnalystOrAdmin() checks
-- In production, implement proper RLS policies with database-backed role validation

-- Disable RLS on intel tables
ALTER TABLE signals DISABLE ROW LEVEL SECURITY;
ALTER TABLE sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE signal_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_logs DISABLE ROW LEVEL SECURITY;

-- This allows:
-- ✓ Anon client can read/write signal data (app validates via requireAnalystOrAdmin())
-- ✓ Service role has full access
-- ✓ No JWT role claim checking needed
-- ✓ App layer authentication via server-side checks

-- TODO: Re-enable RLS in production with proper policies
-- ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
-- Then implement:
-- 1. Simple SELECT policy for authenticated users
-- 2. INSERT/UPDATE/DELETE policies for admin users (check database role)
-- 3. Service role full access
-- 4. Avoid subqueries that reference same table
