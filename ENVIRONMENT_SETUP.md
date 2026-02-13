# Environment Setup - Production Deployment

**Status**: ✅ All Variables Configured

## Required Environment Variables

Set these in **both** `.env.local` (development) and **Vercel** (production):

### Supabase (Required)

```env
# Public URL - Get from Supabase Dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your_project_id.supabase.co

# Anon Key - for client-side operations
# Get from: Supabase Dashboard → Settings → API → Project Keys
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_anon_key_here

# Service Role Key - for server-side admin operations (NEVER expose to client!)
# Get from: Supabase Dashboard → Settings → API → Project Keys → Service Role Secret
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your_service_role_key_here
```

### Cron Jobs (Required for Vercel)

```env
# Generated with: openssl rand -hex 32
# Used to authenticate /api/cron/hourly and /api/cron/daily endpoints
CRON_SECRET=5e5124871a739965b083474bee6a1b1b1cf90dda98aed924029081e6ca3754be
```

### Database (Optional for CLI tools)

```env
# Your Supabase database password
# Used only for: node scripts/apply-db-migration.js
SUPABASE_DB_PASSWORD=your_actual_password_here
```

### Application URLs

```env
# Site URL for authentication redirects
NEXT_PUBLIC_SITE_URL=https://backend.securelab.org

# Development API URL (localhost)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Set by Vercel automatically
VERCEL_URL=backend-securelab.vercel.app
```

### Optional: External APIs

```env
# NVD API for CVE data (optional)
NVD_API_KEY=

# CISA API for known exploited vulnerabilities (optional)
CISA_API_KEY=

# Upstash Redis for advanced rate limiting (optional)
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Email service (future feature)
RESEND_API_KEY=
```

### Development

```env
# Set to 'production' for production builds
NODE_ENV=development

# Enable debug logging
DEBUG=false

# RSS feed update interval (milliseconds)
RSS_FEED_UPDATE_INTERVAL=3600000
```

---

## Setup Instructions

### Local Development

1. **Copy environment template**
   ```bash
   cp .env.example .env.local
   # or manually create with values from "Required Variables" above
   ```

2. **Verify all required variables are set**
   ```bash
   pnpm type-check
   pnpm dev
   ```

3. **Check console for any missing env warnings**

### Vercel Production Deployment

1. **Go to Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **Select project**: `backend_securelab.org`

3. **Settings → Environment Variables**

4. **Add each required variable**:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://efybjwirnwtrclqkwyvs.supabase.co`
   - Environments: All (Production, Preview, Development)

5. **Repeat for all required variables**

6. **After adding variables**:
   - Redeploy from Vercel dashboard
   - Or: `git commit --allow-empty -m "trigger redeploy" && git push`

---

## Verification Checklist

### Local Environment

```bash
# Check environment variables are loaded
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Run type check
pnpm type-check

# Start dev server
pnpm dev

# Open http://localhost:3000/admin - should require login
```

### Production (Vercel)

After deployment:

1. **Check build success**
   - Vercel Dashboard → Deployments → Latest build
   - Should show "✅ Ready"

2. **Test authentication**
   - Go to: `https://backend.securelab.org/login`
   - Should load without errors

3. **Test cron endpoint**
   ```bash
   curl -X POST https://backend.securelab.org/api/cron/hourly \
     -H "Authorization: Bearer $CRON_SECRET"
   ```
   - Should return: `{"status":"ok",...}`

4. **Check error handling**
   - Try accessing `/admin` without login
   - Should redirect to `/login`

5. **Monitor logs**
   - Vercel Dashboard → Logs → Errors
   - Should be clean (no auth errors)

---

## Secure Secrets Management

### Never Commit Secrets

```bash
# ❌ WRONG - Don't commit .env.local
echo ".env.local" >> .gitignore

# ✅ RIGHT - Create template without secrets
cp .env.local .env.example
# Edit .env.example and remove all secret values
git add .env.example
git commit -m "docs: add environment template"
```

### Vercel UI vs .env.local

| Location | Used For | Should Contain |
|----------|----------|-----------------|
| `.env.local` | Local development | Real secrets (never commit!) |
| Vercel Dashboard | Production | Real secrets (encrypted by Vercel) |
| `.env.example` | Documentation | Template only (no secrets) |

### Rotating Secrets

If secrets are compromised:

1. **CRON_SECRET**:
   - Generate new: `openssl rand -hex 32`
   - Update: `.env.local` and Vercel
   - Redeploy

2. **Supabase Keys**:
   - Go to: Supabase Dashboard → Settings → API
   - Rotate API Key: Generates new anon and service role keys
   - Update: Both `.env.local` and Vercel
   - Redeploy

---

## Environment-Specific Configuration

### Development (.env.local)

```env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
DEBUG=true
```

**Behavior**:
- Verbose logging enabled
- Faster rebuilds
- Hot reload enabled
- Mock data available

### Production (Vercel)

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://backend.securelab.org
DEBUG=false
```

**Behavior**:
- Production build optimization
- Error reporting
- Performance monitoring
- Real data only

---

## Troubleshooting

### "Cannot find Supabase" Error

**Problem**: `Cannot read property 'select' of undefined`

**Solution**: Check `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://efybjwirnwtrclqkwyvs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

Restart dev server: `pnpm dev`

### "Service role not found" Error

**Problem**: Server actions returning 401

**Solution**: Check `SUPABASE_SERVICE_ROLE_KEY` is set:
```bash
echo $SUPABASE_SERVICE_ROLE_KEY
```

Must start with `sb_secret_`

### Cron Returns 401 Unauthorized

**Problem**: `POST /api/cron/hourly` returns 401

**Solution**: Check Bearer token:
```bash
# In .env.local or Vercel:
CRON_SECRET=5e5124871a739965b083474bee6a1b1b1cf90dda98aed924029081e6ca3754be

# Test with:
curl -X POST http://localhost:3000/api/cron/hourly \
  -H "Authorization: Bearer 5e5124871a739965b083474bee6a1b1b1cf90dda98aed924029081e6ca3754be"
```

### Vercel Deployment Shows Old Code

**Problem**: Code in GitHub is updated but Vercel shows old version

**Solution**:
1. Trigger rebuild: `git commit --allow-empty && git push`
2. Or manually redeploy from Vercel UI
3. Check build logs for errors

---

## Security Best Practices

✅ **DO**:
- Keep `.env.local` in `.gitignore`
- Rotate secrets regularly
- Use different keys for dev vs production
- Monitor Supabase logs for unauthorized access
- Review Vercel logs for errors

❌ **DON'T**:
- Commit `.env.local` to Git
- Share SUPABASE_SERVICE_ROLE_KEY
- Use same key for multiple projects
- Log secrets in error messages
- Expose secrets in client-side code

---

## Next Steps

1. ✅ Set all environment variables in Vercel
2. ✅ Redeploy from Vercel dashboard
3. ✅ Test authentication and cron endpoints
4. ✅ Monitor logs for errors
5. ✅ Apply database migration (see: DATABASE_SETUP.md)

**Estimated Time**: 5 minutes

**Status**: 🟢 Ready to Deploy
