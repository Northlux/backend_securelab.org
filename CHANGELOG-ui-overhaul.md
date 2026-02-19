# UI/UX Overhaul — Changelog

**Date:** 2026-02-19  
**Scope:** Full UI/UX audit and overhaul of SecureLab Backend Admin Portal

---

## Summary

Complete UI/UX overhaul of the admin portal applying industry best practices for admin dashboards. Installed shadcn/ui component library, fixed critical CSS bugs, improved navigation, added loading/error states, and unified design patterns across all pages.

---

## Changes

### 🔧 Infrastructure

- **Installed shadcn/ui** (`npx shadcn@latest init`) with slate/dark theme (new-york style)
- Added 17 shadcn components: Button, Card, Badge, Tooltip, Dialog, DropdownMenu, Separator, Skeleton, Sheet, ScrollArea, Table, Tabs, Input, Label, Select, Textarea, Sonner (toast)
- Added `tailwindcss-animate` plugin
- Updated `tailwind.config.ts` with CSS variable-based color system for shadcn compatibility while preserving existing `slate` and `brand` color tokens
- Added shadcn dark theme CSS variables to `globals.css` matching slate-950 aesthetic

### 🐛 Critical Bug Fixes

- **Fixed dark-text-on-dark-bg bug** in `globals.css`: headings had `color: #0f172a` (navy on slate-950 = invisible) → changed to `text-slate-100`
- **Fixed form input text color**: inputs had `color: #0f172a` → changed to `text-slate-200`
- **Fixed root layout**: removed undefined `bg-cyber-dark` / `text-cyber-text` Tailwind classes → proper `bg-slate-950 text-slate-400`
- **Added `dark` class** to `<html>` element for proper dark mode support

### 🧭 Navigation

- **Route-aware sidebar**: Sidebar now highlights active route using `usePathname()`, auto-expands matching submenu on page load
- **Mobile responsive sidebar**: Replaced broken `lg:hidden` toggle with shadcn `Sheet` component — proper slide-out drawer on mobile/tablet
- **Dynamic breadcrumbs**: Header now shows context-aware breadcrumbs based on current route (was hardcoded "Dashboard / Overview")
- **User dropdown**: Migrated to shadcn `DropdownMenu` for proper keyboard navigation, focus management, and click-outside-to-close
- **Proper ARIA attributes**: `aria-label` on nav, search, buttons; `aria-current="page"` on active links; `aria-expanded` on submenu toggles

### 📐 Layout & Responsiveness

- **Admin layout**: Added `max-w-7xl mx-auto` content constraint, responsive padding (`px-4 sm:px-6 lg:px-8`)
- **Added `min-w-0`** to main content area to prevent flex overflow on narrow viewports
- **Stat cards grid**: Changed from `md:grid-cols-2 lg:grid-cols-4` → `sm:grid-cols-2 lg:grid-cols-4` for better tablet support
- **Backdrop blur header**: Added `backdrop-blur-sm` + opacity background for floating header feel

### ⏳ Loading & Error States

- **Added `app/admin/loading.tsx`**: Skeleton loading state with stat cards + content placeholders using shadcn Skeleton
- **Added `app/admin/error.tsx`**: Error boundary with retry button using shadcn Button
- **Dashboard skeleton**: Custom skeleton matching dashboard layout (stat cards + charts)
- **Intel page**: Replaced spinner fallback with proper skeleton matching intel queue layout

### 🎨 Design Consistency

- **Unified page headers**: All pages now use `text-2xl font-semibold` (was `text-3xl font-600` inconsistently)
- **Unified spacing**: All page headers use `space-y-6` wrapper with consistent `mt-1` on descriptions
- **Empty state pattern**: All placeholder pages (Users, Settings, Access, Subscriptions) now use shadcn Card with centered icon-in-circle + text pattern
- **Dashboard cards**: Migrated to shadcn `Card`, `CardHeader`, `CardTitle`, `CardContent` components
- **Category badges**: Using shadcn `Badge` component for tag display
- **Button consistency**: Refresh/action buttons migrated to shadcn `Button` with `variant="outline"`

### 🗑️ Cleanup

- **Removed `app/components/admin-layout.tsx`**: Unused component (layout is handled by `app/admin/layout.tsx`)
- **Added Sonner toaster** to root layout for global toast notifications

### 🔒 Accessibility

- **Focus-visible styles**: Added global `*:focus-visible` with brand-colored ring + offset for keyboard navigation
- **ARIA labels**: Navigation, search input, hamburger menu, notification bell all have proper labels
- **Scrollbar refinement**: Thinner 6px scrollbar with rounded thumb

### ⚠️ Not Changed (per constraints)

- API routes (`app/api/`) — untouched
- Auth flow (`app/(auth)/`) — untouched (styling was already good)
- Supabase client (`lib/supabase/server.ts`) — untouched
- Mobile triage page (`app/mobile/page.tsx`) — functional, left as-is (mobile-optimized already)
- Intel components (`signal-card.tsx`, `signal-filters.tsx`, `bulk-actions.tsx`, `intel-queue.tsx`, `toast.tsx`) — working well, only page wrapper updated

---

## Files Modified

| File | Change |
|---|---|
| `package.json` | Added shadcn dependencies (class-variance-authority, clsx, tailwind-merge, etc.) |
| `tailwind.config.ts` | Added CSS variable colors, shadcn compat, animations, darkMode |
| `app/globals.css` | Fixed text colors, added CSS variables, focus-visible styles |
| `app/layout.tsx` | Fixed classes, added dark mode, added Sonner toaster |
| `app/admin/layout.tsx` | Responsive padding, max-width, role="main" |
| `app/admin/page.tsx` | Migrated to shadcn Card/Button/Badge/Skeleton, better responsive grid |
| `app/admin/intel/page.tsx` | Better skeleton loading, consistent header |
| `app/admin/sources/page.tsx` | Consistent header styling |
| `app/admin/logs/page.tsx` | Consistent header styling |
| `app/admin/users/page.tsx` | shadcn Card empty state |
| `app/admin/settings/page.tsx` | shadcn Card empty state |
| `app/admin/access/page.tsx` | shadcn Card empty state |
| `app/admin/subscriptions/page.tsx` | shadcn Card empty state |
| `app/components/sidebar.tsx` | Route-aware active states, mobile Sheet drawer, ARIA |
| `app/components/header.tsx` | Dynamic breadcrumbs, shadcn DropdownMenu, ARIA |
| `components.json` | shadcn config (slate theme) |
| `lib/utils.ts` | shadcn cn() utility |
| `components/ui/*.tsx` | 17 shadcn UI components |

## Files Added

| File | Purpose |
|---|---|
| `app/admin/loading.tsx` | Skeleton loading state for admin routes |
| `app/admin/error.tsx` | Error boundary with retry |
| `components/ui/*.tsx` (17 files) | shadcn/ui component library |
| `lib/utils.ts` | cn() utility for class merging |
| `CHANGELOG-ui-overhaul.md` | This file |

## Files Removed

| File | Reason |
|---|---|
| `app/components/admin-layout.tsx` | Unused duplicate of admin layout |
