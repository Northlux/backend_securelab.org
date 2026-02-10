# Phase 4: User & Subscription Management Implementation Plan

**Status**: 🚀 IN PROGRESS
**Date**: February 10, 2026
**Estimated Duration**: 4-6 hours
**Priority**: 🟡 MEDIUM (enhancement after Phase 3)

---

## Vision & Design Direction

### Aesthetic Continuity
- **Inherit**: Dark cyber aesthetic (slate-950 background, brand-600 accents)
- **Enhance**: Data-driven sophistication with cleaner table layouts
- **Differentiate**: Use role/subscription tier visual badges for quick identification
- **Tone**: Professional, data-focused, high-information density with elegant simplicity

### Key Design Decisions
1. **Typography**: Keep system fonts (no weight added fonts) - elegant minimalism
2. **Colors**: Maintain slate-950/slate-900 backgrounds with brand-600 accents
3. **Components**: Leverage existing patterns (cards, tables, forms)
4. **Motion**: Smooth transitions on row hover, subtle loading states
5. **Layout**: Two-column admin layout (sidebar + content)

---

## Implementation Breakdown

### 1. User Management Pages (2.5 hours)

#### 1.1 `/app/admin/users/page.tsx` - User Listing
**Features**:
- Table with columns: Email, Role, Status, Created Date, Last Login, Actions
- Search box (client-side filter)
- Filter by role (dropdown): All, Admin, Analyst, User, Suspended
- Pagination (20 items per page)
- Bulk operations: Select multiple, change role, suspend/unsuspend
- Action buttons: View Details, Edit, Suspend, Delete
- Loading states and empty states

**Components Used**:
- Table with hover effects
- Badge for role/status
- Action icons (Edit, Eye, Trash)
- Filter dropdown
- Pagination buttons

**Data**: Mock users from Supabase (or fetch from real data)

#### 1.2 `/app/admin/users/[id]/page.tsx` - User Detail & Edit
**Features**:
- User profile card with avatar, email, name
- Edit form: Email, Role dropdown, Status toggle
- Subscription section: Current tier, renews on date
- Activity log: Last login, account created, last password change
- Action buttons: Save Changes, Suspend Account, Delete Account
- Confirmation dialogs for destructive actions

**Components Used**:
- Profile header with avatar
- Form inputs with labels
- Status badges
- Confirmation modal
- Activity timeline

**Data**: Fetch from Supabase users/subscriptions tables

#### 1.3 `/app/admin/users/pending/page.tsx` - Pending Verification
**Features**:
- Table of users awaiting email verification
- Verification date, email, status
- Actions: Send verification email, approve, reject
- Bulk actions: Approve all, reject all
- Email preview button

**Components Used**:
- Similar to user list but with verification-specific actions

#### 1.4 `/app/admin/users/suspended/page.tsx` - Suspended Users
**Features**:
- Table of suspended users
- Suspension reason, date, admin who suspended
- Unsuspend button, delete button
- Notes/reasons displayed
- Restore capabilities with confirmation

**Components Used**:
- User table with suspension reason column

---

### 2. Subscription Management Pages (2.5 hours)

#### 2.1 `/app/admin/subscriptions/page.tsx` - Subscription Listing
**Features**:
- Table: User Email, Tier, Status, Monthly Cost, Start Date, End Date, Actions
- Filter by status (Active, Canceled, Expired)
- Filter by tier (Free, Pro, Enterprise)
- Search by user email
- Pagination (20 per page)
- Bulk operations: Cancel selected, refund selected
- Action buttons: View Details, Manage, Cancel, Refund
- Cost column shows monthly recurring revenue

**Components Used**:
- Table with status badges (green=active, red=canceled, gray=expired)
- Tier badges with color coding
- Cost display with currency formatting
- Filter dropdowns
- Confirmation dialogs

**Data**: Fetch from Supabase subscriptions table

#### 2.2 `/app/admin/subscriptions/[id]/page.tsx` - Subscription Detail
**Features**:
- User info (email, name, avatar)
- Current subscription details (tier, price, start, end)
- Billing history (last 10 payments)
- Upgrade/downgrade options with preview pricing
- Cancel subscription with reason selector
- Refund options
- Activity log

**Components Used**:
- Subscription summary card
- Billing table
- Confirmation modals
- Pricing comparison

#### 2.3 `/app/admin/subscriptions/tiers/page.tsx` - Subscription Tier Management
**Features**:
- Card grid showing current tiers (Free, Pro, Enterprise)
- For each tier: Name, price, feature list, user count
- Edit button → modal with form
- Add new tier button
- Drag-to-reorder tiers (optional)
- Feature toggles/checkboxes
- Pricing input fields

**Components Used**:
- Tier cards in grid layout
- Feature list with checkboxes
- Modal form for editing
- Price input with currency

**Data**: Fetch from Supabase subscription_tiers table

#### 2.4 `/app/admin/subscriptions/billing/page.tsx` - Billing History
**Features**:
- Transaction table: User, Amount, Status, Date, Invoice ID
- Filter by status (paid, pending, failed)
- Filter by date range
- Search by invoice ID or user email
- View invoice button (links to PDF or receipt)
- Refund button with reason selector
- CSV export

**Components Used**:
- Filterable transaction table
- Date range picker
- Status badges
- Action buttons

#### 2.5 `/app/admin/subscriptions/requests/page.tsx` - Upgrade Requests
**Features**:
- Table: User, From Tier, To Tier, Requested Date, Status, Actions
- Status: pending, approved, rejected, completed
- Approve/reject buttons with optional notes
- Email preview
- Bulk approve/reject
- Auto-approve threshold (if requested)

**Components Used**:
- Request table with status
- Approval form modal
- Note textarea

---

### 3. Database Schema (Already Exists)

**Tables to Query**:
- `users` - User accounts with roles
- `subscriptions` - User subscription records
- `subscription_tiers` - Tier definitions (Free, Pro, Enterprise)
- `billing_history` - Payment records
- `upgrade_requests` - Tier change requests

**No migrations needed** - use existing schema

---

### 4. Server Actions Needed

#### User Management Actions
- `getUsers()` - Paginated list with filters
- `getUserById(id)` - Single user detail
- `updateUser(id, data)` - Edit user role/status
- `suspendUser(id, reason)` - Suspend account
- `unsuspendUser(id)` - Restore account
- `deleteUser(id)` - Delete user

#### Subscription Actions
- `getSubscriptions()` - Paginated list with filters
- `getSubscriptionById(id)` - Single subscription detail
- `getSubscriptionTiers()` - All tier definitions
- `updateSubscriptionTier(tierId, data)` - Edit tier
- `createSubscriptionTier(data)` - New tier
- `deleteSubscriptionTier(id)` - Remove tier
- `cancelSubscription(id, reason)` - Cancel subscription
- `refundSubscription(id, amount, reason)` - Process refund
- `getUpgradeRequests()` - List pending requests
- `approveUpgradeRequest(id)` - Approve tier change
- `rejectUpgradeRequest(id, reason)` - Reject request

---

## File Structure

```
/app/admin/
├── users/
│   ├── page.tsx (user listing)
│   ├── page-client.tsx (client component with filters)
│   ├── [id]/
│   │   ├── page.tsx (user detail)
│   │   └── page-client.tsx (client component with form)
│   ├── pending/
│   │   ├── page.tsx (pending users)
│   │   └── page-client.tsx (client component)
│   ├── suspended/
│   │   ├── page.tsx (suspended users)
│   │   └── page-client.tsx (client component)
│   └── roles/
│       ├── page.tsx (role management)
│       └── page-client.tsx (client component)
├── subscriptions/
│   ├── page.tsx (subscription listing)
│   ├── page-client.tsx (client component with filters)
│   ├── [id]/
│   │   ├── page.tsx (subscription detail)
│   │   └── page-client.tsx (client component)
│   ├── tiers/
│   │   ├── page.tsx (tier listing)
│   │   └── page-client.tsx (client component)
│   ├── billing/
│   │   ├── page.tsx (billing history)
│   │   └── page-client.tsx (client component)
│   └── requests/
│       ├── page.tsx (upgrade requests)
│       └── page-client.tsx (client component)

/app/actions/
├── users.ts (user server actions)
└── subscriptions.ts (subscription server actions)

/app/components/admin/
├── user-table.tsx (reusable user table)
├── subscription-table.tsx (reusable subscription table)
├── tier-card.tsx (tier display component)
├── user-detail-form.tsx (edit user form)
└── subscription-detail-form.tsx (subscription form)
```

---

## Implementation Order

### Phase 4A: Foundation (1 hour)
1. Create server actions: `/app/actions/users.ts`
2. Create shared components: `user-table.tsx`, `subscription-table.tsx`
3. Create `/app/admin/users/page.tsx` with listing

### Phase 4B: User Management (1.5 hours)
4. Create `/app/admin/users/[id]/page.tsx` with detail view and edit form
5. Create `/app/admin/users/pending/page.tsx` (verification)
6. Create `/app/admin/users/suspended/page.tsx` (suspended accounts)

### Phase 4C: Subscription Management (1.5 hours)
7. Create server actions: `/app/actions/subscriptions.ts`
8. Create `/app/admin/subscriptions/page.tsx` with listing
9. Create `/app/admin/subscriptions/tiers/page.tsx` with CRUD
10. Create `/app/admin/subscriptions/[id]/page.tsx` with detail

### Phase 4D: Polish & Testing (1 hour)
11. Add error handling and loading states
12. Test all pages with Playwright
13. Verify forms work end-to-end
14. Document API and usage

---

## Success Criteria

- ✅ All 7 user management pages created and functional
- ✅ All 5 subscription management pages created and functional
- ✅ Server actions implemented for all CRUD operations
- ✅ Consistent styling with existing admin interface
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Loading states and error handling
- ✅ Confirmation dialogs for destructive actions
- ✅ TypeScript strict mode: 0 errors
- ✅ Playwright tests pass (or auth-required)
- ✅ All commits pushed to GitHub

---

## Git Commit Strategy

### Commit 1: Foundation & User Management
```
feat: add user management pages (listing, detail, pending, suspended)

- Create server actions for user CRUD operations
- Add /app/admin/users pages with listing and detail views
- Add /app/admin/users/pending for email verification workflow
- Add /app/admin/users/suspended for account suspension management
- Implement user filtering, search, pagination
- Implement edit user form with role/status changes
```

### Commit 2: Subscription Management
```
feat: add subscription management pages (listing, tiers, billing, requests)

- Create server actions for subscription CRUD operations
- Add /app/admin/subscriptions pages with listing and detail views
- Add /app/admin/subscriptions/tiers for tier management
- Add /app/admin/subscriptions/billing for transaction history
- Add /app/admin/subscriptions/requests for upgrade requests
- Implement subscription filtering, search, pagination
```

### Commit 3: Polish & Documentation
```
docs: add Phase 4 implementation documentation

- Document user management features and workflows
- Document subscription management features
- Add deployment instructions
- Provide testing and verification checklist
```

---

## Design System Adherence

**Colors**:
- Background: `bg-slate-950` (primary), `bg-slate-900` (secondary)
- Accents: `text-brand-600`, `border-brand-600`, `hover:bg-brand-600`
- Status: `text-green-400` (active), `text-red-400` (inactive), `text-gray-400` (pending)

**Typography**:
- Headers: `text-xl` or `text-2xl` font-semibold
- Body: `text-base` font-normal
- Labels: `text-sm` font-medium

**Spacing**:
- Page padding: `p-8`
- Card padding: `p-6`
- Gap between items: `gap-4` or `gap-6`

**Components**:
- Tables: Striped rows, hover effect, checkboxes for selection
- Forms: Standard inputs, validation on blur, clear error messages
- Buttons: Primary (`bg-brand-600`), Secondary (`bg-slate-700`), Danger (`bg-red-600`)
- Modals: Confirmation dialogs before destructive actions

---

## Testing Strategy

### Manual Testing
1. Login to admin dashboard
2. Navigate to each user management page
3. Test filtering, search, pagination
4. Test edit user → save → verify changes
5. Test suspend → verify can unsuspend
6. Test subscription pages similarly
7. Test tier editing and feature toggles
8. Test confirmation dialogs on delete

### Playwright Tests
1. User list page loads
2. User detail form works
3. Subscription list loads
4. Tier editing works
5. Filters and search work
6. Pagination works
7. Loading states appear during async operations

---

## Timeline Estimate

| Task | Estimate | Status |
|------|----------|--------|
| Plan & Setup | 30 min | ✅ Done |
| Server Actions | 45 min | 🔄 Next |
| User Pages | 1.5 hrs | 🔄 Next |
| Subscription Pages | 1.5 hrs | 🔄 Next |
| Testing & Polish | 1 hr | 🔄 Next |
| **Total** | **5 hours** | |

---

**Next Step**: Begin implementation with server actions and foundation components.
