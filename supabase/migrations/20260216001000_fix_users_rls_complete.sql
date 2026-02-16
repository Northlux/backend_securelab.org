-- Complete RLS Policy Fix for Users Table
-- Issue: Subquery-based policies cause circular evaluation and "cannot coerce" errors
-- Solution: Use simpler, non-circular RLS policies that work with existing schema

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;

-- Policy 1: Users can view and manage their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Service role has full access (for backend operations)
CREATE POLICY "Service role can manage users"
  ON users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- For now, admin viewing is handled via auth.role() = 'service_role'
-- In production, implement a separate admin table or use JWT custom claims
