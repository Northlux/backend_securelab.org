'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bell, ChevronDown, ChevronRight, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  userEmail?: string | null
}

const ROUTE_LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/intel': 'Intel Management',
  '/admin/sources': 'Sources',
  '/admin/logs': 'Ingestion Logs',
  '/admin/users': 'Users',
  '/admin/subscriptions': 'Subscriptions',
  '/admin/access': 'Access Control',
  '/admin/settings': 'Settings',
}

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Build breadcrumb trail
  const crumbs: { label: string; href: string }[] = []

  if (segments.length >= 1 && segments[0] === 'admin') {
    crumbs.push({ label: 'Dashboard', href: '/admin' })

    if (segments.length >= 2) {
      const path = `/admin/${segments[1]}`
      const label = ROUTE_LABELS[path] || segments[1]!.charAt(0).toUpperCase() + segments[1]!.slice(1)
      crumbs.push({ label, href: path })

      // If there's a third segment (e.g., /admin/intel/[id])
      if (segments.length >= 3) {
        crumbs.push({ label: segments[2]!.slice(0, 8) + '…', href: pathname })
      }
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} className="text-slate-700" />}
          {i === crumbs.length - 1 ? (
            <span className="text-slate-200 font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}

export function Header({ userEmail }: HeaderProps) {
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const userInitial = userEmail?.[0]?.toUpperCase() || 'U'

  return (
    <header className="bg-slate-950/80 backdrop-blur-sm border-b border-slate-800/50 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 lg:px-8 py-4">
        {/* Breadcrumbs — left side, with left padding on mobile for hamburger */}
        <div className="pl-10 lg:pl-0">
          <Breadcrumbs />
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-500 hover:text-slate-300"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2.5 px-3 py-2 h-auto text-left"
              >
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {userInitial}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                    {userEmail || 'User'}
                  </div>
                  <div className="text-[10px] text-slate-500">Admin</div>
                </div>
                <ChevronDown size={14} className="text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
              <DropdownMenuLabel className="text-xs text-slate-400 font-normal truncate">
                {userEmail}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-slate-300 hover:text-red-400 focus:text-red-400 focus:bg-red-950/20 cursor-pointer"
              >
                <LogOut size={14} className="mr-2" />
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
