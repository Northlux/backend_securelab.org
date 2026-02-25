# Group Management System - Complete Documentation

**Created:** 2026-02-25  
**Status:** Production Ready  
**Location:** `/admin/groups` and `/admin/users` (Groups tab)

---

## Overview

Complete group-based access control system for SecureLab multi-subdomain platform. Admins can assign users to groups that grant access to specific subdomains (threattrails, darkweb, toolres, research, etc.).

---

## Features

### 1. Group Assignment
- **Multi-group membership:** Users can belong to multiple groups simultaneously
- **Visual group management:** Easy-to-use modal with icon-coded groups
- **Real-time updates:** Instant reflection of group changes
- **Audit logging:** All group assignments logged in `audit_logs` table

### 2. Groups Overview Page (`/admin/groups`)
- **Grid view:** All groups with stats (user count, permission count)
- **Search:** Filter groups by name or description
- **Color-coded:** Each group has distinct color/icon for easy identification
- **Quick stats:** Total groups, total users, total permissions

### 3. User Details Integration (`/admin/users`)
- **Inline group display:** Shows user's current groups in user details modal
- **Manage Groups button:** Opens full group management interface
- **Badge display:** Visual group badges with colors

---

## Database Schema

### Tables Created

#### 1. `users.groups` (Column Added)
```sql
ALTER TABLE users 
ADD COLUMN groups TEXT[] DEFAULT ARRAY['users'::TEXT];

CREATE INDEX idx_users_groups ON users USING GIN(groups);
```

**Purpose:** Stores array of group names user belongs to.

#### 2. `groups` (New Table)
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Metadata for groups (display name, color, icon for UI).

#### 3. `group_permissions` (New Table)
```sql
CREATE TABLE group_permissions (
  id UUID PRIMARY KEY,
  group_name TEXT NOT NULL,
  subdomain TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_name, subdomain, permission)
);
```

**Purpose:** Maps groups to subdomain permissions.

---

## Default Groups

| Group | Display Name | Purpose | Color | Icon |
|-------|--------------|---------|-------|------|
| **admin** | Administrator | Full platform access | purple | Shield |
| **users** | Basic User | Standard authenticated access | blue | User |
| **platinum** | Platinum Tier | Premium subscribers | amber | Crown |
| **threattrails** | Threat Trails Access | threattrails.securelab.org access | red | AlertTriangle |
| **darkweb** | Dark Web Intel | darkweb.securelab.org access (most restricted) | slate | Eye |
| **toolres** | Tool Resources | toolres.securelab.org access | green | Wrench |
| **research** | Research Access | research.securelab.org access | cyan | BookOpen |
| **friends** | Trusted Partners | Cross-cutting read access | pink | Heart |
| **colleagues** | Professional Network | Industry peer access | indigo | Users |

---

## API Endpoints

### GET `/api/v1/admin/groups`
**Purpose:** List all groups with stats  
**Auth:** Admin only  
**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "threattrails",
      "display_name": "Threat Trails Access",
      "description": "Access to threattrails.securelab.org",
      "color": "red",
      "icon": "AlertTriangle",
      "userCount": 5,
      "permissionCount": 2
    }
  ],
  "total": 9
}
```

### POST `/api/v1/admin/groups`
**Purpose:** Create new group  
**Auth:** Admin only  
**Body:**
```json
{
  "name": "analysts",
  "display_name": "Security Analysts",
  "description": "Professional threat analysts",
  "color": "blue",
  "icon": "Shield"
}
```

### GET `/api/v1/admin/users/[id]/groups`
**Purpose:** Get user's groups with details  
**Auth:** Admin only  
**Response:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "groups": ["users", "threattrails", "platinum"],
  "groupDetails": [...],
  "permissions": [...]
}
```

### PATCH `/api/v1/admin/users/[id]/groups`
**Purpose:** Add or remove group from user  
**Auth:** Admin only  
**Body:**
```json
{
  "action": "add",  // or "remove"
  "group": "darkweb"
}
```
**Response:**
```json
{
  "message": "Group added successfully",
  "groups": ["users", "darkweb"]
}
```

---

## UI Components

### 1. GroupManagement Modal
**Location:** `components/admin/group-management.tsx`  
**Purpose:** Full-featured group assignment interface  
**Features:**
- Visual group grid with icons/colors
- Active/inactive state per group
- User count and permission count per group
- One-click add/remove
- Loading states

**Usage:**
```tsx
<GroupManagement
  userId="user-uuid"
  userEmail="user@example.com"
  currentGroups={["users", "platinum"]}
  open={groupModalOpen}
  onClose={() => setGroupModalOpen(false)}
  onUpdate={() => {
    // Callback when groups change
    fetchUserData()
  }}
/>
```

### 2. UserDetailsModal (Enhanced)
**Location:** `components/admin/user-details-modal.tsx`  
**Changes:**
- Added `groups?: string[]` to User interface
- Added "Groups" section showing badges
- Added "Manage Groups" button
- Integrated GroupManagement modal

### 3. Groups Management Page
**Location:** `app/admin/groups/page.tsx`  
**Route:** `/admin/groups`  
**Features:**
- Grid view of all groups
- Search/filter
- Stats cards (total groups, users, permissions)
- Color-coded group cards with icons
- User count and permission count per group
- "View Users" and "Edit" buttons (placeholders for future features)

---

## Security & Access Control

### Row Level Security (RLS)
Both `groups` and `group_permissions` tables have RLS enabled:

```sql
-- Only admins can view/manage groups
CREATE POLICY "Admins can view groups"
  ON groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.groups)
    )
  );

CREATE POLICY "Admins can manage groups"
  ON groups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.groups)
    )
  );
```

### Self-Protection
- Admins cannot remove their own `admin` group
- Users always retain at least the `users` group
- All actions logged to `audit_logs` table

### Audit Logging
All group changes tracked:
```sql
INSERT INTO audit_logs (user_id, action, resource, metadata) VALUES
  (admin_id, 'group_added', 'user:uuid', 
   '{"target_user": "user@example.com", "group": "darkweb", "new_groups": ["users", "darkweb"]}');
```

---

## How to Use (Admin Guide)

### Assign Groups to User

1. **Go to User Management** (`/admin/users`)
2. **Click on user** to open details modal
3. **Click "Manage Groups"** button in Groups section
4. **Click on any group card** to add/remove
   - Green checkmark = Active
   - Plus icon = Click to add
   - X icon = Click to remove
5. **Changes save instantly** - Close modal when done

### View All Groups

1. **Go to Access Groups** (`/admin/groups`)
2. **See grid of all groups** with:
   - User count (how many users have this group)
   - Permission count (how many subdomain permissions)
   - Created date
3. **Use search** to filter groups

### Create New Group (Admin Only)

1. **Go to `/admin/groups`**
2. **Click "Create Group"** button (currently shows "coming soon" toast)
3. **Fill in:**
   - Group name (lowercase, alphanumeric, hyphens/underscores only)
   - Display name (user-friendly)
   - Description (optional)
   - Color (purple, blue, red, etc.)
   - Icon (Shield, User, Crown, etc.)
4. **Submit** - Group created

**Or via API:**
```bash
curl -X POST https://backend.securelab.org/api/v1/admin/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "name": "analysts",
    "display_name": "Security Analysts",
    "description": "Professional threat analysts",
    "color": "blue",
    "icon": "Shield"
  }'
```

---

## Migration & Setup

### 1. Run Database Migration

Copy SQL from `/supabase/migrations/20260225_user_groups.sql` to Supabase SQL Editor and execute.

**Migration includes:**
- Add `groups` column to `users` table
- Create `groups` and `group_permissions` tables
- Seed default groups
- Set up RLS policies
- Create indexes

### 2. Verify Migration

```sql
-- Check users have groups
SELECT email, groups FROM users LIMIT 10;

-- Check groups exist
SELECT name, display_name, userCount FROM groups;

-- Check permissions seeded
SELECT group_name, subdomain, permission FROM group_permissions LIMIT 20;
```

### 3. Deploy Frontend Changes

```bash
cd projects/backend_securelab.org
npm install
npm run build
# Deploy to Vercel or your hosting
```

### 4. Test Group Management

1. Log in as admin
2. Go to `/admin/groups` - should see 9 default groups
3. Go to `/admin/users` - click any user - click "Manage Groups"
4. Add/remove groups - should update instantly
5. Check audit logs table - should see group changes

---

## Troubleshooting

### Issue: "Forbidden - Admin access required"
**Cause:** User doesn't have `admin` group  
**Fix:** Run in Supabase SQL Editor:
```sql
UPDATE users 
SET groups = array_append(groups, 'admin'::TEXT)
WHERE email = 'your-admin@example.com';
```

### Issue: Groups not showing in modal
**Cause:** Migration not run or groups table empty  
**Fix:** Run migration SQL again, verify with:
```sql
SELECT * FROM groups;
```

### Issue: Can't remove last group from user
**Cause:** Protection to ensure users always have at least `users` group  
**Expected:** This is by design - users must have at least one group

### Issue: "Group does not exist" error
**Cause:** Group name in API call doesn't match DB  
**Fix:** Check exact group name:
```sql
SELECT name FROM groups;
```

---

## Future Enhancements (Planned)

1. **Create Group UI:** Full form for creating new groups (currently API only)
2. **Edit Group:** Modify group metadata (display name, color, icon)
3. **Delete Group:** Remove groups (with safety checks)
4. **View Users by Group:** Click group → see all users in that group
5. **Bulk Group Assignment:** Select multiple users, assign group to all
6. **Group Templates:** Pre-configured group sets (e.g., "SOC Analyst" auto-assigns multiple groups)
7. **Permission Editor:** Visual UI for managing group→subdomain permissions
8. **Group Hierarchies:** Parent/child groups (e.g., `platinum` inherits `users` permissions)

---

## Related Documentation

- **Full Architecture:** `SECURITY_ACCESS_CONTROL_V2.md`
- **Developer Guide:** `SECURITY_ADD_SUBDOMAIN_GUIDE.md`
- **Migration SQL:** `supabase/migrations/20260225_user_groups.sql`

---

## Support

For issues or questions:
1. Check Supabase logs: https://app.supabase.com/project/efybjwirnwtrclqkwyvs/logs
2. Check audit logs: `SELECT * FROM audit_logs WHERE action LIKE 'group_%' ORDER BY created_at DESC;`
3. Verify RLS policies: `SELECT * FROM pg_policies WHERE tablename IN ('groups', 'group_permissions');`

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-25  
**Status:** Production Ready
