-- Disable RLS on Users Table for Development
-- Note: Security is handled at the application layer via requireAdmin() checks
-- In production, implement proper RLS policies after schema stabilizes

-- Disable RLS for now
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- This allows:
-- ✓ Anon client can read/write user data (app validates via requireAdmin())
-- ✓ Service role has full access
-- ✓ No circular policy dependencies
-- ✓ App layer authentication via server-side checks

-- TODO: Re-enable RLS in production with proper policies
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Then implement:
-- 1. Simple SELECT policy for users to see own profile
-- 2. Service role full access
-- 3. Avoid subqueries that reference same table
