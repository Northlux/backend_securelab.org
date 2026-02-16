# RLS Policy Fix - Backend Authentication

## Problem

The `/admin` pages are returning error:
```
AuthError: User profile not found and could not be created
  Caused by: "new row violates row-level security policy for table \"users\""
```

## Root Cause

The migration `20260207_create_users_and_auth.sql` created an overly restrictive RLS policy:

```sql
CREATE POLICY "Only backend can modify users"
  ON users FOR ALL
  USING (false)
  WITH CHECK (false);
```

This policy blocks **all operations** on the users table with `USING (false)` and `WITH CHECK (false)`, which means:
- No one can read rows (`USING (false)`)
- No one can insert/update/delete rows (`WITH CHECK (false)`)

Even though the auth trigger has `SECURITY DEFINER`, the RLS policy still blocks the operation.

## Solution

**Option 1: Quick Fix (Recommended)**

Go to Supabase Dashboard → SQL Editor and run:

```sql
DROP POLICY IF EXISTS "Only backend can modify users" ON public.users;
```

This removes the problematic policy. The remaining RLS policies from the migration will handle access control:
- Users can view their own profile
- Admins can view all profiles

**Option 2: Full RLS Refresh**

Run the migration to add comprehensive RLS policies:

```sql
-- File: supabase/migrations/20260216000000_fix_users_rls_policy.sql
DROP POLICY IF EXISTS "Only backend can modify users" ON users;
```

## How to Apply the Fix

### Via Supabase Dashboard (Easiest)

1. Go to https://app.supabase.com/
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "+ New Query"
5. Copy and paste:
   ```sql
   DROP POLICY IF EXISTS "Only backend can modify users" ON public.users;
   ```
6. Click "Run"
7. Reload your admin pages

### Via Supabase CLI

```bash
supabase db push
```

This will apply all migrations including `20260216000000_fix_users_rls_policy.sql`

### Via Vercel Deployment

```bash
git add .
git commit -m "fix: add RLS policy fix for users table"
git push
```

The Supabase integration will apply the migration automatically.

## Testing

After applying the fix:

1. Reload http://localhost:3004/admin/intel/sources
2. The page should load without authentication errors
3. You should see the Sources management interface
4. Database record for "masteradmin@securelab.org" should be created automatically

## Technical Details

### Why the Policy Blocked Everything

The original policy used:
- `FOR ALL` - applies to SELECT, INSERT, UPDATE, DELETE
- `USING (false)` - no rows pass the security check
- `WITH CHECK (false)` - no new/modified rows pass the check

This is a complete deny policy.

### Why SECURITY DEFINER Didn't Work

Even though the `handle_new_user()` trigger function has `SECURITY DEFINER`, it still respects the table's RLS policies. The policy's `USING (false)` prevents the insert from succeeding.

### The Fix

Removing the policy allows:
- The auth trigger to create user records when new auth users are created
- Backend code to insert users via the service_role key
- Remaining RLS policies handle authorization properly

## Prevention

In future migrations, avoid:
1. ❌ `USING (false)` and `WITH CHECK (false)` as a blanket deny
2. ❌ Overly restrictive policies that block legitimate backend operations

Instead:
1. ✅ Use specific conditions: `USING (auth.uid() = id)`
2. ✅ Allow service_role explicitly if needed for triggers
3. ✅ Test RLS policies before deploying to production

## More Information

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Postgres Security Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [Supabase Triggers](https://supabase.com/docs/guides/database/databases#triggers)
