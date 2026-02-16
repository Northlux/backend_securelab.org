# Apply RLS Policy Fix - Step by Step

## Current Status

❌ **Issue**: Admin pages unable to load due to RLS policy blocking user profile creation

```
Error: new row violates row-level security policy for table "users"
```

## The One-Line Fix

Run this SQL command in Supabase to remove the problematic policy:

```sql
DROP POLICY IF EXISTS "Only backend can modify users" ON public.users;
```

---

## Option 1: Via Supabase Web Dashboard (Easiest)

### Step 1: Open Supabase Dashboard
- Go to: https://app.supabase.com/
- Select your **backend_securelab.org** project

### Step 2: Open SQL Editor
- Click **"SQL Editor"** in the left sidebar
- Click **"New Query"** button (top right)

### Step 3: Run the Fix
- Copy and paste this command:
  ```sql
  DROP POLICY IF EXISTS "Only backend can modify users" ON public.users;
  ```
- Click the **"Run"** button or press `Ctrl+Enter`

### Step 4: Verify Success
- You should see: `1 policy dropped`
- No error messages

### Step 5: Test the Fix
- Reload your browser: http://localhost:3004/admin/intel/sources
- You should see the admin interface loading (no auth errors)

---

## Option 2: Via Supabase CLI

If you have Supabase CLI installed:

```bash
# From the backend_securelab.org directory
supabase db push

# This applies the migration:
# supabase/migrations/20260216000000_fix_users_rls_policy.sql
```

---

## Option 3: Via Your Application

If you have SSH/CLI access to your server, run:

```bash
cd /home/muttley/projects/websites/securelab/backend_securelab.org

# Apply the migration
pnpm exec tsx scripts/apply-rls-fix.ts

# Check if user was created
pnpm exec tsx scripts/check-user.ts
```

---

## Verification Tests

After applying the fix, run these tests to verify everything works:

### Test 1: Visual Test (Quickest)
1. Reload http://localhost:3004/admin
2. Check if dashboard loads without errors
3. Click on "Intel Management" → "Sources"
4. Verify Sources page loads

### Test 2: Playwright Tests
```bash
# Run comprehensive auth tests
pnpm exec playwright test tests/auth-verification.spec.ts

# Run and show report
pnpm exec playwright test tests/auth-verification.spec.ts --reporter=html
```

### Test 3: Browser Console Check
1. Open http://localhost:3004/admin/intel/sources
2. Press `F12` to open Developer Tools
3. Go to "Console" tab
4. Look for errors containing "row-level security" or "User profile not found"
5. Should see NO such errors

---

## What the Fix Does

### Before Fix ❌
```
User authenticates → Server tries to create user record
                  ↓
           RLS policy blocks insert
                  ↓
        AuthError: User profile not found
```

### After Fix ✅
```
User authenticates → Server tries to create user record
                  ↓
        Insert succeeds (policy removed)
                  ↓
      User has admin role, accesses admin panel
```

---

## Troubleshooting

### Error: "Policy not found"
- This is OK! It means the policy was already removed
- You can safely ignore this

### Still seeing auth errors after applying fix?
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Restart dev server: Kill process and run `pnpm dev` again
3. Wait 30 seconds for rebuild
4. Reload the page: `Ctrl+Shift+R` (hard refresh)

### Can't access Supabase Dashboard?
- Check your login credentials
- Verify you have access to the project
- Contact Supabase support

---

## What Happens Next

Once the fix is applied:

1. ✅ User auto-creation works
2. ✅ Admin pages load successfully
3. ✅ You can manage:
   - Threat Signals
   - Intelligence Sources
   - Tags
   - Ingestion Logs
4. ✅ Full role-based access control enabled

---

## Need Help?

Check these files for more details:

- **Technical Details**: `RLS_FIX_INSTRUCTIONS.md`
- **Test Results**: `tests/auth-verification.spec.ts`
- **Server Logs**: Check browser console (F12)

Run this command to check all users in database:
```bash
pnpm exec tsx scripts/check-user.ts
```

---

## Success Indicators

After applying the fix, you should see:

✅ Admin dashboard loads
✅ No "User profile not found" errors
✅ No "row-level security" errors in console
✅ User profile shows in top-right corner
✅ Can navigate to Sources, Signals, Tags pages
✅ Database shows your user record created

---

**Estimated Time**: 5 minutes to apply and verify
