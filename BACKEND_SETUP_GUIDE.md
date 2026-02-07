# Backend Setup Guide - Securelab

## Overview

This document describes the backend infrastructure setup for `backend.securelab.org`. The backend manages:
- User authentication and profiles
- Subscription management (to be implemented)
- Access control for multi-app platform
- Admin interfaces and tools
- Audit logging and security

## Completed: Phase 1 - Foundation & Authentication Schema

### ✅ Project Initialization

**What's Set Up:**
- Next.js 15 with TypeScript (strict mode)
- Supabase integration (client & server)
- Tailwind CSS with cyber aesthetic
- ESLint configuration
- Git ignore rules

**Key Files:**
```
backend_securelab.org/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   └── globals.css                # Global styles
├── lib/supabase/
│   ├── server.ts                  # Server-side Supabase client
│   └── client.ts                  # Client-side browser client
├── supabase/migrations/
│   └── 20260207_create_users_and_auth.sql  # Auth schema
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript strict mode
├── tailwind.config.ts             # Tailwind configuration
├── .env.local                     # Symlink to shared .env.local
└── README.md                      # Project documentation
```

**Verification:**
```bash
cd backend_securelab.org
pnpm type-check       # ✅ All TypeScript passes
pnpm dev              # Ready to run dev server
```

### ✅ Database Schema: Users & Authentication

**Location:** `supabase/migrations/20260207_create_users_and_auth.sql`

**Core Tables Created:**

#### 1. `users` (Extended Profile)
Links to Supabase `auth.users` via foreign key.

Fields:
- `id` (UUID) - Primary key, references auth.users(id)
- `email` - User email (must be lowercase)
- `full_name` - Display name
- `avatar_url` - Profile picture URL
- `role` - User role (admin, user, guest)
- `status` - Account status (active, inactive, suspended, pending_verification)
- `metadata` - JSONB for custom data
- `created_at`, `updated_at`, `last_login_at` - Timestamps

RLS Policies:
- Users can view their own profile
- Admins can view all profiles
- Only service_role can modify (enforced on backend)

#### 2. `email_verifications`
Manages email verification for signup flow.

Fields:
- `id` (UUID) - Token ID
- `user_id` (UUID) - References users(id)
- `token` - Unique verification token
- `expires_at` - Token expiration time
- `verified_at` - When token was used

Purpose:
- Users can view their own tokens
- Tokens auto-expire after verification
- Can be cleaned up with `cleanup_expired_tokens()` function

#### 3. `password_reset_tokens`
Secure password recovery mechanism.

Fields:
- `id` (UUID) - Token ID
- `user_id` (UUID) - References users(id)
- `token` - Unique reset token
- `expires_at` - Token expiration
- `used_at` - When token was redeemed

Purpose:
- Secure, single-use password recovery
- Tokens expire after use or after time limit
- Used tokens not deleted (audit trail)

#### 4. `user_sessions`
Track active user sessions (devices/browsers).

Fields:
- `id` (UUID) - Session ID
- `user_id` (UUID) - References users(id)
- `session_token` - Unique session identifier
- `user_agent` - Browser/device info
- `ip_address` - Client IP address
- `last_activity_at` - Last action timestamp
- `expires_at` - Session expiration

Purpose:
- Session management and tracking
- Device list for users (e.g., "Logout from all other devices")
- Security monitoring

#### 5. `audit_logs`
Comprehensive security audit trail.

Fields:
- `id` (UUID) - Log entry ID
- `user_id` (UUID) - Who performed action (nullable for system)
- `action` - What happened (login, access_denied, etc.)
- `resource_type` - Type of resource affected
- `resource_id` - Specific resource ID
- `ip_address`, `user_agent` - Client info
- `metadata` - JSONB for additional context
- `created_at` - When action occurred

RLS Policies:
- Users can view their own logs
- Admins can view all logs
- Only backend can create logs

### ✅ Automatic Features

**Triggers Implemented:**

1. **`handle_new_user()`**
   - Automatically creates user profile when auth user signs up
   - Syncs email and full_name from auth.users metadata

2. **`update_user_updated_at()`**
   - Auto-updates `updated_at` timestamp on any user profile change

**Functions Implemented:**

1. **`cleanup_expired_tokens()`**
   - Can be called manually or via cron job
   - Deletes expired email verification tokens
   - Deletes used password reset tokens older than expiry

## Next Steps: Phase 2 - Subscription System

(Not yet implemented - placeholder for next phase)

Will implement:
- Subscription tiers table
- User subscriptions table
- Access control linking users to apps
- Subscription upgrade/downgrade flow

## Environment Variables

**Shared:** Located at `/securelab/.env.local`

Backend project symlinks this file:
```bash
backend_securelab.org/.env.local -> ../.env.local
```

**Required Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_SITE_URL=https://backend.securelab.org
NODE_ENV=development
```

## Database Setup Instructions

### Option 1: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase  # macOS
# or see https://supabase.com/docs/guides/cli/getting-started

# Navigate to backend project
cd backend_securelab.org

# Link to your Supabase project
supabase link --project-ref <project-ref>

# Push migrations
supabase db push

# (Optional) Open database UI
supabase studio
```

### Option 2: Manual - Supabase Dashboard

1. Go to https://app.supabase.com/
2. Open SQL Editor
3. Copy contents of `supabase/migrations/20260207_create_users_and_auth.sql`
4. Paste into editor and execute

## Verification Checklist

After setting up, verify everything works:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'users' OR table_name LIKE 'email_verifications'
OR table_name LIKE 'password_reset_tokens'
OR table_name LIKE 'user_sessions'
OR table_name LIKE 'audit_logs';

-- Check RLS is enabled
SELECT tablename FROM pg_tables
WHERE schemaname='public' AND tablename LIKE 'users';

SELECT * FROM pg_class
WHERE relname IN ('users', 'email_verifications', 'password_reset_tokens', 'user_sessions', 'audit_logs')
AND relrowsecurity = true;
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Type check (TypeScript strict mode)
pnpm type-check

# Start dev server (localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Security Model

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies enforce data isolation
- Users see only their own data (except admins)
- Modifications only allowed via service_role key

### Authentication Flow
1. User signs up/logs in via Supabase Auth
2. Auth trigger auto-creates user profile
3. Server verifies auth.uid() and role
4. Backend enforces permissions via RLS policies
5. All actions logged to audit_logs

### Secrets Management
- `SUPABASE_SERVICE_ROLE_KEY` - Server-only (never expose to client)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client-safe (public data only)
- RLS policies prevent unauthorized access even with anon key

## User Roles & Statuses

### Roles
```
admin    - Full system access, can manage all users
user     - Regular authenticated user
guest    - Limited access, no account
```

### Statuses
```
active                - Account is active
inactive              - User deactivated account
suspended             - Admin suspended account
pending_verification  - Awaiting email verification
```

## Planned API Endpoints

(To be implemented in Phase 2)

Authentication:
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Password reset request
- `POST /api/auth/verify-email` - Verify email token

User Profile:
- `GET /api/v1/user/profile` - Get own profile
- `PUT /api/v1/user/profile` - Update profile
- `GET /api/v1/user/sessions` - List active sessions

Admin:
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/audit-logs` - View audit logs
- `PUT /api/v1/admin/user/:id/role` - Change user role
- `PUT /api/v1/admin/user/:id/status` - Suspend/activate user

## File Structure Deep Dive

### App Router (`app/`)
- `layout.tsx` - Root layout (wraps all pages)
- `page.tsx` - Home page (/)
- `globals.css` - Global styles and CSS variables

### Libraries (`lib/`)
- `supabase/server.ts` - Server-side Supabase clients
- `supabase/client.ts` - Client-side Supabase singleton

### Database (`supabase/`)
- `migrations/` - SQL migration files
  - `20260207_create_users_and_auth.sql` - Initial auth schema

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration (strict mode)
- `tailwind.config.ts` - Tailwind CSS theming
- `next.config.js` - Next.js configuration
- `.eslintrc.json` - Linting rules

## Troubleshooting

### "No environment variables" error
Verify `.env.local` exists and symlink is correct:
```bash
ls -la .env.local   # Should show -> ../.env.local
cat .env.local      # Should show actual env vars
```

### TypeScript errors on startup
Run type check:
```bash
pnpm type-check
```

### Supabase connection fails
- Verify `NEXT_PUBLIC_SUPABASE_URL` and keys are correct
- Check Supabase project is running
- Verify RLS policies aren't blocking access

### Port 3000 already in use
```bash
pnpm dev -p 3001    # Use alternate port
```

## What's NOT Included (Phase 2+)

- Subscription system (tiers, pricing, etc.)
- API endpoints (routes to be added)
- Admin dashboard (UI components)
- Email service integration
- Stripe/payment integration
- Email templates

## Related Documentation

- `/securelab/PROJECT.md` - Platform architecture
- `README.md` - Quick reference
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs

## Next Actions

1. **Verify Schema:** Apply migration to Supabase
2. **Create Auth Endpoints:** POST /auth/signup, etc.
3. **Test Signup Flow:** Register test user
4. **Build Subscription System:** Phase 2

---

**Status:** ✅ Phase 1 Complete (2026-02-07)
**Next Phase:** Phase 2 - Subscription System (TBD)
