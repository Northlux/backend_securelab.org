'use client'

import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import {
  ChevronDown,
  LayoutDashboard,
  Users,
  CreditCard,
  Lock,
  Settings,
  LogOut,
  Search,
  Shield,
  Radio,
  ScrollText,
} from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getSupabaseClient } from '@/lib/supabase/client'

interface MenuItem {
  label: string
  href: string
  icon: React.ReactNode
  subItems?: { label: string; href: string }[]
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'Intel Management',
    href: '/admin/intel',
    icon: <Shield size={18} />,
    subItems: [
      { label: 'Signal Queue', href: '/admin/intel' },
      { label: 'Pending Review', href: '/admin/intel?status=pending' },
      { label: 'Approved', href: '/admin/intel?status=approved' },
      { label: 'In Review', href: '/admin/intel?status=review' },
    ],
  },
  {
    label: 'Sources',
    href: '/admin/sources',
    icon: <Radio size={18} />,
  },
  {
    label: 'Ingestion Logs',
    href: '/admin/logs',
    icon: <ScrollText size={18} />,
  },
  {
    label: 'User Management',
    href: '/admin/users',
    icon: <Users size={18} />,
    subItems: [
      { label: 'All Users', href: '/admin/users' },
      { label: 'Pending Verification', href: '/admin/users/pending' },
      { label: 'Suspended Users', href: '/admin/users/suspended' },
      { label: 'User Roles', href: '/admin/users/roles' },
    ],
  },
  {
    label: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: <CreditCard size={18} />,
    subItems: [
      { label: 'All Subscriptions', href: '/admin/subscriptions' },
      { label: 'Subscription Tiers', href: '/admin/subscriptions/tiers' },
      { label: 'Billing History', href: '/admin/subscriptions/billing' },
      { label: 'Upgrade Requests', href: '/admin/subscriptions/requests' },
    ],
  },
  {
    label: 'Access Control',
    href: '/admin/access',
    icon: <Lock size={18} />,
    subItems: [
      { label: 'Access Policies', href: '/admin/access/policies' },
      { label: 'App Permissions', href: '/admin/access/permissions' },
      { label: 'Audit Log', href: '/admin/access/audit' },
    ],
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: <Settings size={18} />,
  },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname.startsWith(href.split('?')[0]!)
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(() => {
    const match = menuItems.find(
      (item) => item.subItems && isActive(pathname, item.href)
    )
    return match?.label ?? null
  })

  const currentSearch = searchParams.toString() ? `?${searchParams.toString()}` : ''

  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems
    const q = searchQuery.toLowerCase()
    return menuItems.filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true
      if (item.subItems?.some((sub) => sub.label.toLowerCase().includes(q))) return true
      return false
    })
  }, [searchQuery])

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Branding */}
      <div className="p-6 border-b border-slate-800/50 flex-shrink-0">
        <Link href="/admin" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
            S
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-100 text-sm leading-tight">Securelab</div>
            <div className="text-xs text-slate-500">Admin Portal</div>
          </div>
        </Link>
      </div>

      {/* Search — filters sidebar nav items */}
      <div className="p-4 border-b border-slate-800/50 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            aria-label="Search navigation"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
          />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav aria-label="Main navigation" className="px-3 space-y-0.5">
          {filteredMenuItems.map((item) => {
            const active = isActive(pathname, item.href)
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = expandedMenu === item.label

            return (
              <div key={item.label}>
                {hasSubItems ? (
                  <button
                    onClick={() =>
                      setExpandedMenu(isExpanded ? null : item.label)
                    }
                    aria-expanded={isExpanded}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                      active
                        ? 'text-brand-400 bg-brand-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform text-slate-600 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                      active
                        ? 'text-brand-400 bg-brand-500/10 font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )}

                {/* Sub-items */}
                {hasSubItems && isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-800/50 pl-3">
                    {item.subItems?.map((subItem) => {
                      const subActive = pathname + currentSearch === subItem.href ||
                        (subItem.href === item.href && pathname === item.href.split('?')[0] && !searchParams.toString())
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={onNavigate}
                          className={`block px-3 py-1.5 text-xs rounded-md transition-all duration-150 ${
                            subActive
                              ? 'text-brand-400 bg-brand-500/5'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-slate-800/50 p-3 space-y-0.5 flex-shrink-0">
        <Link
          href="/admin/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all duration-150"
        >
          <Settings size={16} />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all duration-150 disabled:opacity-50"
        >
          <LogOut size={16} />
          <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>
        </button>
      </div>
    </div>
  )
}

export function Sidebar({ mobileOpen, onMobileOpenChange }: { mobileOpen: boolean; onMobileOpenChange: (open: boolean) => void }) {
  return (
    <>
      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-slate-800">
          <SidebarNav onNavigate={() => onMobileOpenChange(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col h-screen bg-slate-900 border-r border-slate-800/50 flex-shrink-0">
        <SidebarNav />
      </aside>
    </>
  )
}
