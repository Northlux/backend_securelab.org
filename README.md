# Backend Securelab

User and subscription management portal for the Securelab platform.

## Project Structure

```
backend_securelab.org/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── lib/
│   └── supabase/
│       ├── server.ts       # Server-side Supabase client
│       └── client.ts       # Client-side Supabase client
├── supabase/
│   └── migrations/         # Database migrations
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind CSS config
├── postcss.config.js       # PostCSS config
└── next.config.js          # Next.js config
```

## Getting Started

### 1. Install Dependencies

```bash
cd backend_securelab.org
pnpm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` (or symlink from parent `/securelab/.env.local`):

```bash
# Option A: Copy from parent
cp ../.env.local .env.local

# Option B: Symlink from parent
ln -s ../.env.local .env.local
```

### 3. Create Symlink for Shared Environment

For consistency with other projects, create a symlink:

```bash
cd /home/muttley/projects/websites/securelab/backend_securelab.org
ln -s ../.env.local .env.local
```

### 4. Database Setup

The database schema is defined in `supabase/migrations/`. When ready, apply migrations to Supabase:

```bash
# Using Supabase CLI (after installing)
supabase db push

# Or manually:
# 1. Go to Supabase dashboard
# 2. SQL Editor
# 3. Copy contents of migrations/*.sql
# 4. Execute in order
```

## Development

```bash
# Start dev server (runs on port 3000)
pnpm dev

# Type check
pnpm type-check

# Lint
pnpm lint

# Build for production
pnpm build
pnpm start
```

## Database Schema

### Core Tables

**users** - Extended user profile
- Links to `auth.users` via foreign key
- Stores full_name, avatar_url, role, status, metadata
- Auto-created via trigger when auth user is created

**email_verifications** - Email verification tokens
- Used for verifying new user email addresses
- Contains token and expiration time

**password_reset_tokens** - Password recovery
- Secure tokens for password reset flow
- Single-use tokens with expiration

**user_sessions** - Session tracking
- Active user sessions for device management
- Tracks IP, user agent, last activity

**audit_logs** - Security audit trail
- All authentication and user actions logged
- Resource tracking for compliance

### Role-Based Access

```
- admin    : Full system access
- user     : Regular authenticated user
- guest    : Limited access
```

### User Status

```
- active              : User account is active
- inactive            : Account deactivated by user
- suspended           : Account suspended by admin
- pending_verification: Awaiting email verification
```

## Row Level Security (RLS)

All tables have RLS policies enforced:

- Users can view their own data
- Admins can view all user data
- Data modifications only allowed via backend service_role key
- Audit logs visible to own user + admins

## Planned Features

### Phase 1: Authentication ✅ (Current)
- [x] User profile management
- [x] Email verification
- [x] Password reset
- [x] Session tracking
- [x] Audit logging

### Phase 2: Subscription System (Next)
- [ ] Subscription tiers (free, basic, premium, enterprise)
- [ ] User subscriptions
- [ ] App access control
- [ ] Billing integration

### Phase 3: Admin Portal (Future)
- [ ] User management dashboard
- [ ] Subscription management
- [ ] Analytics and reporting
- [ ] System configuration

## API Endpoints (To Be Implemented)

Authentication:
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT
- `POST /api/auth/reset-password` - Password reset request
- `POST /api/auth/verify-email` - Verify email token

Users:
- `GET /api/v1/user/profile` - Get authenticated user profile
- `PUT /api/v1/user/profile` - Update user profile
- `GET /api/v1/user/sessions` - List user sessions

Admin:
- `GET /api/v1/admin/users` - List all users
- `PUT /api/v1/admin/user/:id/role` - Change user role
- `PUT /api/v1/admin/user/:id/status` - Change user status
- `GET /api/v1/admin/audit-logs` - View audit logs

## Security

- All sensitive operations use service_role key (server-only)
- Client-side uses anon key (public operations only)
- RLS policies enforce data boundaries
- Tokens auto-expire (email verification, password reset)
- All user actions logged for audit trail
- Passwords managed by Supabase Auth (never exposed in app)

## Environment Variables

See `.env.example` for all required variables.

Key variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Secret key (server-only)
- `NEXT_PUBLIC_SITE_URL` - Backend domain (for redirects)

## Deployment

See Vercel deployment guide (link to be added).

Steps:
1. Push to GitHub
2. Configure Vercel environment variables
3. Deploy
4. Run database migrations (if not auto-applied)

## Support

For questions or issues, refer to:
- `/securelab/PROJECT.md` - Platform architecture
- Supabase documentation
- Next.js documentation
