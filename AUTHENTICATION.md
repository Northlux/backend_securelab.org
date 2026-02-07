# Backend Authentication System

## Overview

The Securelab Backend (`backend.securelab.org`) includes a complete production-ready authentication system powered by **Supabase Auth**. Users can create accounts, log in, and access the admin dashboard.

## Architecture

### Auth Flow

```
User → Login/Signup Page → Supabase Auth
                             ↓
                      Email Confirmation
                             ↓
                      /auth/callback (verify)
                             ↓
                      Admin Dashboard (/admin)
```

### Key Components

**1. Authentication Pages** (`app/(auth)/`)
- **Login Page** (`login/page.tsx`): Email/password sign-in
- **Signup Page** (`signup/page.tsx`): Account registration with email verification
- **Auth Layout** (`layout.tsx`): Shared layout for auth pages

**2. Route Protection** (`middleware.ts`)
- Middleware checks authentication on protected routes
- Unauthenticated users redirected to `/login`
- Authenticated users redirected away from auth pages

**3. Admin Section** (`app/admin/`)
- **Dashboard** (`page.tsx`): Main admin interface
- **Admin Layout** (`layout.tsx`): Header + sidebar + protected content

**4. Callbacks & Helpers**
- **Email Verification** (`app/auth/callback/route.ts`): Handles email confirmation links
- **Home Redirect** (`app/page.tsx`): Routes to login or dashboard based on auth state
- **Header Component** (`app/components/header.tsx`): User profile dropdown + logout

## Features

✅ **Email/Password Authentication**
- Register new accounts
- Sign in with email and password
- Password must be at least 8 characters
- Password confirmation on signup

✅ **Email Verification**
- Users receive confirmation email after signup
- Click link in email to verify account
- Account active after verification

✅ **Session Management**
- Secure JWT-based sessions
- Automatic session refresh
- Logout clears session cookies

✅ **Protected Routes**
- Middleware enforces authentication on `/admin/*`
- Unauthenticated users redirected to login
- Authenticated users shown user email in header

✅ **Error Handling**
- Clear error messages for invalid credentials
- Invalid email/password feedback
- Network error handling

✅ **User Experience**
- Loading states on form submission
- Responsive design (mobile-first)
- Professional dark theme
- Smooth transitions and animations

## File Structure

```
app/
├── (auth)/                          # Auth group (public routes)
│   ├── layout.tsx                   # Auth pages layout
│   ├── login/
│   │   └── page.tsx                 # Login form
│   └── signup/
│       └── page.tsx                 # Signup form
├── auth/
│   └── callback/
│       └── route.ts                 # Email verification handler
├── admin/                           # Protected routes
│   ├── layout.tsx                   # Admin layout with header/sidebar
│   └── page.tsx                     # Dashboard
├── components/
│   ├── header.tsx                   # User menu + logout
│   ├── sidebar.tsx                  # Navigation sidebar
│   └── admin-layout.tsx             # Removed (now admin/layout.tsx)
├── layout.tsx                       # Root layout
├── page.tsx                         # Home (redirects based on auth)
└── globals.css                      # Styling
```

## Usage

### Starting Development Server

```bash
pnpm dev
# Server runs on http://localhost:3000 (or next available port)
```

### Authentication URLs

| Route | Purpose |
|-------|---------|
| `/` | Home (auto-redirects) |
| `/login` | Sign in page |
| `/signup` | Create account |
| `/auth/callback` | Email verification |
| `/admin` | Dashboard (protected) |

### Testing Locally

1. **Create an account:**
   - Navigate to `/signup`
   - Enter email and password
   - Verify email (in development, check console or email service)

2. **Sign in:**
   - Navigate to `/login`
   - Enter email and password
   - Redirected to dashboard

3. **Access protected routes:**
   - Try accessing `/admin` without logging in
   - Should redirect to `/login`

## Security Features

✅ **Row Level Security (RLS)**
- Users can only view their own subscription
- Admins have elevated access
- Audit logs record all access attempts

✅ **Environment Variables**
- Supabase URL and keys in `.env.local`
- Service role key only used server-side
- Anon key used for client-side queries

✅ **Middleware Protection**
- Session validation on every request
- Automatic redirect for unauthenticated users
- Protected routes require active session

✅ **Form Validation**
- Email format validation
- Password strength requirements (8+ chars)
- Password confirmation matching

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Schema

The authentication system relies on Supabase Auth, which provides:

- `auth.users` - User accounts (managed by Supabase)
- `public.users` - Extended user profiles (created from migration)
  - `id` (foreign key to auth.users)
  - `email`
  - `role` (admin, user, guest)
  - `status` (active, inactive, suspended, pending_verification)
  - `created_at`, `updated_at`

## Middleware Flow

```typescript
GET /admin
  ↓
middleware.ts checks session
  ├─ If authenticated → Allow access
  └─ If not authenticated → Redirect to /login?next=/admin
```

## Error Handling

### Login Errors

| Error | Cause | Message |
|-------|-------|---------|
| Invalid credentials | Wrong password | "Invalid login credentials" |
| User not found | Email doesn't exist | "Invalid login credentials" |
| Email not verified | Account pending confirmation | "Email not confirmed" |
| Network error | Connection issue | "An unexpected error occurred" |

### Signup Errors

| Error | Cause | Message |
|-------|-------|---------|
| Email exists | Account already created | "User already registered" |
| Weak password | < 8 characters | "Password must be at least 8 characters" |
| Passwords don't match | Mismatch | "Passwords do not match" |

## Next Steps

After authentication is working, the next phase is implementing the **Subscription System**:

1. Create `subscription_tiers` and `subscriptions` tables
2. Build subscription management APIs
3. Add access control based on subscription tier
4. Integrate with intel.securelab.org for multi-app access

See `PROJECT.md` for the full architecture plan.

## Troubleshooting

**"Port 3000 is in use"**
- Next.js will use the next available port (3007, 3008, etc.)
- Or kill the process: `lsof -i :3000 | tail -1 | awk '{print $2}' | xargs kill`

**"Cannot find module @/lib/supabase/client"**
- Ensure `.env.local` exists in project root
- Run `pnpm install`

**"Invalid supabaseUrl"**
- Check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- Should be format: `https://xxxx.supabase.co`

**Email verification not working**
- In development, Supabase sends emails to real addresses
- Check email for confirmation link
- Or use Supabase dashboard to manually confirm

## Build & Deployment

### Production Build

```bash
pnpm build
# Creates optimized .next directory
```

### Deploy to Vercel

```bash
git push origin main
# Vercel auto-deploys from GitHub
# Configure environment variables in Vercel dashboard
```

### Environment Variables in Vercel

Set in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review Next.js docs: https://nextjs.org/docs
3. Check project logs: `pnpm dev` output

---

**Last Updated:** February 7, 2026
**Status:** ✅ Production Ready
