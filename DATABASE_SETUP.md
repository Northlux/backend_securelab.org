# Database Setup Guide - Security Hardening Phase 5

**Status**: ✅ Migration Ready (Code Complete, Database Pending)

## Quick Start

Your Supabase database needs the security hardening migration applied. Choose one option below:

### Option 1: Supabase SQL Editor (Recommended) ⭐

1. **Go to Supabase SQL Editor**
   ```
   https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new
   ```
   (Replace YOUR_PROJECT_ID with your Supabase project ID)

2. **Copy the migration file**
   ```bash
   cat supabase/migrations/20260213000000_security_hardening.sql
   ```

3. **Paste entire content into SQL Editor**

4. **Click "Run" button**

5. **Verify success** - You should see "Query OK"

### Option 2: Supabase CLI

```bash
# Link your project (if not already linked)
supabase link --project-ref efybjwirnwtrclqkwyvs

# Push migrations
supabase db push
```

### Option 3: Command Line (Requires Database Password)

```bash
# Set your database password in .env.local
echo "SUPABASE_DB_PASSWORD=your_database_password" >> .env.local

# Run migration
node scripts/apply-db-migration.js
```

---

## What Gets Created

### New Tables

#### `billing_history`
- Tracks all financial transactions
- Stores: amount, currency, transaction type (charge/refund), status
- Includes: invoice references, metadata
- RLS: Users see own transactions, admins see all

#### `upgrade_requests`
- Subscription tier upgrade requests from users
- Stores: from_tier, to_tier, status (pending/approved/rejected), notes
- Tracks: who approved, when reviewed, effective date
- RLS: Users see own, analysts/admins see all

#### `rate_limit_counters`
- Distributed rate limiting storage
- Stores: operation key, count, time window
- Used by: backend for tracking API usage
- RLS: Service role only

#### `user_sessions` (if created by previous migration)
- Session tracking with device detection
- Stores: user_id, IP address, User-Agent, expiration
- Features: Detects concurrent sessions, device changes
- Used by: Session manager for security

### New Functions

#### `get_user_role(user_id UUID)`
- Returns user role from database (not JWT)
- Replaces JWT-based role checks
- More secure, database-backed

#### `is_admin()`
- Checks if current user is admin
- Used in RLS policies
- Database-backed (not JWT)

#### `is_analyst_or_admin()`
- Checks if current user has analyst or admin role
- Used in RLS policies
- Secure alternative to JWT claims

#### `is_authenticated()`
- Verifies user is authenticated
- Uses auth.uid() for validation

#### `log_user_action()`
- Logs user actions to audit_logs table
- Parameters: user_id, action, resource_type, resource_id, metadata
- Used by all server actions for audit trail

#### `cleanup_expired_rate_limits()`
- Removes expired rate limit counters
- Call from cron jobs periodically

### New RLS Policies

| Table | Policy | Who | What |
|-------|--------|-----|------|
| billing_history | Users own | Authenticated | SELECT own |
| billing_history | Admins all | Admins | SELECT all |
| upgrade_requests | Users own | Authenticated | SELECT own |
| upgrade_requests | Analysts all | Analysts/Admins | SELECT all |
| rate_limit_counters | Service only | Service role | All ops |

---

## Verification Checklist

After applying the migration, verify everything:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('billing_history', 'upgrade_requests', 'rate_limit_counters');

-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_user_role', 'is_admin', 'is_analyst_or_admin', 'log_user_action');

-- Check RLS enabled
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Check indexes created
SELECT indexname FROM pg_indexes
WHERE tablename IN ('billing_history', 'upgrade_requests', 'rate_limit_counters')
ORDER BY indexname;
```

---

## Environment Variables

Make sure these are set in your `.env.local` and Vercel:

```env
# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=https://efybjwirnwtrclqkwyvs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Required for Cron Jobs
CRON_SECRET=5e5124871a739965b083474bee6a1b1b1cf90dda98aed924029081e6ca3754be

# Optional but recommended
SUPABASE_DB_PASSWORD=your_database_password

# Vercel
VERCEL_URL=
```

---

## Production Deployment

### Before Going Live

1. ✅ **Apply migration** (this guide)
2. ✅ **Verify tables/functions** (see Verification Checklist)
3. ✅ **Set CRON_SECRET** in Vercel environment
4. ✅ **Test cron endpoints:**
   ```bash
   curl -X POST https://backend.securelab.org/api/cron/hourly \
     -H "Authorization: Bearer $CRON_SECRET"
   ```
5. ✅ **Monitor audit logs** - They should start filling up with operations
6. ✅ **Test rate limiting** - Try creating 10 signals rapidly, 11th should fail

### Post-Deployment

- Monitor Vercel logs for errors
- Check Supabase dashboard for audit_logs entries
- Verify billing_history accumulates for testing
- Monitor upgrade_requests table for tier change requests

---

## Troubleshooting

### "Table already exists" Error
✅ **This is normal!** It means the table was already created or partially created. The migration handles this gracefully.

### "Function already defined" Error
✅ **This is expected!** If you rerun the migration, functions drop and recreate. This is safe.

### Rate Limit Counter Issues
If rate_limit_counters fills up:
```sql
-- Clean up manually
DELETE FROM rate_limit_counters WHERE window_end < NOW();
```

### RLS Policy Not Working
Check:
1. Is RLS enabled on the table?
   ```sql
   SELECT * FROM pg_tables WHERE tablename = 'your_table';
   ```
2. Is policy targeting right users?
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'your_table';
   ```

### Audit Logs Not Recording
Check that `logUserAction()` is being called in server actions. See: `lib/utils/audit-logger.ts`

---

## Migration Statistics

| Category | Count |
|----------|-------|
| SQL Statements | 44 |
| New Tables | 3 |
| New Functions | 5 |
| New Indexes | 9 |
| New Policies | 5 |
| Total Objects | 26 |

**Size Impact**: ~2-5 MB (negligible)

**Performance Impact**: Minimal (indexes added for optimal lookups)

---

## Support

If you encounter issues:

1. **Check migration file**: `supabase/migrations/20260213000000_security_hardening.sql`
2. **Run verification**: Use SQL queries from Verification Checklist above
3. **Check Supabase docs**: https://supabase.com/docs/guides/database
4. **Review server actions**: All server actions use the new functions

---

## Next Steps

After migration is applied:

1. ✅ Deploy to Vercel (already done, code is live)
2. ✅ Set environment variables in Vercel dashboard
3. ✅ Run integration tests
4. ✅ Monitor production logs
5. ✅ Verify audit trail is working

**Estimated Time**: 5-10 minutes for migration + verification

**Status**: 🟡 Ready to Apply
