-- Fix RLS Policy for Users Table
-- Issue: The "Only backend can modify users" policy blocks ALL operations
--        including trigger-based inserts that use SECURITY DEFINER
-- Solution: Drop the overly restrictive policy

-- ✅ Step 1: Drop the policy that blocks everything
DROP POLICY IF EXISTS "Only backend can modify users" ON users;
