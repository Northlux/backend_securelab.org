# RLS Fix for Intel Tables - Step-by-Step Guide

**Problem**: Signals are seeded but not displaying in admin panel (showing "0 signals total")

**Root Cause**: RLS policies on signals/sources/tags tables are checking JWT role claims, but the anon client doesn't have admin role in JWT. Authorization is handled at application layer instead.

**Solution**: Disable RLS on intel tables for development (same pattern as users table)

---

## Quick Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query** (top right)

### Step 2: Run the SQL Commands

Copy and paste these commands into the SQL Editor:

```sql
-- Disable RLS on Intel Management Tables for Development
ALTER TABLE signals DISABLE ROW LEVEL SECURITY;
ALTER TABLE sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE signal_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_logs DISABLE ROW LEVEL SECURITY;
```

Click **Run** (Ctrl+Enter)

### Step 3: Verify and Reload

```sql
-- Verify RLS is disabled (should show false for all)
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('signals', 'sources', 'tags', 'signal_tags', 'ingestion_logs')
ORDER BY tablename;
```

### Step 4: Hard Refresh Browser

Press: **Ctrl+Shift+R** (or Cmd+Shift+R on Mac)

Navigate to: http://localhost:3007/admin/intel/signals

✅ You should now see all 10 seeded signals!

---

## What This Does

| Table | Column | Before | After |
|-------|--------|--------|-------|
| signals | RLS Enabled | ✓ Enabled (blocking) | ✗ Disabled |
| sources | RLS Enabled | ✓ Enabled (blocking) | ✗ Disabled |
| tags | RLS Enabled | ✓ Enabled (blocking) | ✗ Disabled |
| signal_tags | RLS Enabled | ✓ Enabled (blocking) | ✗ Disabled |
| ingestion_logs | RLS Enabled | ✓ Enabled (blocking) | ✗ Disabled |

**Security Model**:
- ✅ Authentication: Supabase Auth + session validation
- ✅ Authorization: Application layer via `requireAnalystOrAdmin()` checks
- ✅ Validation: Zod schemas on all inputs
- ✅ Audit Trail: User actions logged to database
- ✅ Rate Limiting: Per-operation limits enforced

Database-backed role validation is more secure than JWT claims because:
1. Roles are stored in `users.role` column (can be updated instantly)
2. JWT roles can't be revoked until token expires
3. Admin/analyst checks happen on every request
4. No need for token re-generation after role changes

---

## Expected Results

### Before RLS Fix
```
Dashboard: "0 signals total"
Signals List: "No signals found"
Server Logs: No errors (silent failure)
```

### After RLS Fix
```
Dashboard: "10 signals total"
Signals List: Shows all 10 threat intelligence signals
Filters: Work correctly (severity, category)
Search: Works across title/summary
```

---

## Troubleshooting

### Still showing 0 signals?

1. **Check migration was applied**:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'signals';
   -- Should return: rowsecurity = FALSE
   ```

2. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R
   - Clear cookies: DevTools → Application → Cookies → Delete all

3. **Restart dev server**:
   ```bash
   # Stop: Ctrl+C
   pnpm dev
   ```

4. **Verify signals in database**:
   ```sql
   SELECT COUNT(*) FROM signals;
   -- Should return: 10
   ```

---

## Production Considerations

In production, we will:

1. **Re-enable RLS** on all tables
2. **Implement proper RLS policies** using database-backed role validation:
   ```sql
   -- Example for production
   ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can view signals"
     ON signals FOR SELECT
     USING (EXISTS (
       SELECT 1 FROM users
       WHERE id = auth.uid()
       AND (role = 'admin' OR role = 'analyst')
     ));
   ```
3. **Use stored procedures** for complex authorization logic
4. **Avoid JWT role claims** - always validate from database

---

## Files Reference

- **Migration**: `supabase/migrations/20260216002000_disable_rls_intel_for_dev.sql`
- **Auth Logic**: `lib/auth/server-auth.ts` (requireAnalystOrAdmin function)
- **Signals Page**: `app/admin/intel/signals/page.tsx`
- **Signals Action**: `app/actions/intel/signals.ts` (getSignals function)

---

**Ready?** Follow the Quick Fix steps above and report the results! 🚀
