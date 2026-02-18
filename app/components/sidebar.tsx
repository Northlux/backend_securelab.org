'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ChevronDown,
  LayoutDashboard,
  Users,
  CreditCard,
  Lock,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Shield,
  Radio,
} from 'lucide-react'

interface MenuItem {
  label: string
  href: string
  icon: React.ReactNode
  subItems?: MenuItem[]
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
      { label: 'Signal Queue', href: '/admin/intel', icon: null },
      { label: 'Pending Review', href: '/admin/intel?status=pending', icon: null },
      { label: 'Approved', href: '/admin/intel?status=approved', icon: null },
      { label: 'In Review', href: '/admin/intel?status=review', icon: null },
    ],
  },
  {
    label: 'Sources',
    href: '/admin/sources',
    icon: <Radio size={18} />,
  },
  {
    label: 'User Management',
    href: '#',
    icon: <Users size={18} />,
    subItems: [
      { label: 'All Users', href: '/admin/users', icon: null },
      { label: 'Pending Verification', href: '/admin/users/pending', icon: null },
      { label: 'Suspended Users', href: '/admin/users/suspended', icon: null },
      { label: 'User Roles', href: '/admin/users/roles', icon: null },
    ],
  },
  {
    label: 'Subscriptions',
    href: '#',
    icon: <CreditCard size={18} />,
    subItems: [
      { label: 'All Subscriptions', href: '/admin/subscriptions', icon: null },
      { label: 'Subscription Tiers', href: '/admin/subscriptions/tiers', icon: null },
      { label: 'Billing History', href: '/admin/subscriptions/billing', icon: null },
      { label: 'Upgrade Requests', href: '/admin/subscriptions/requests', icon: null },
    ],
  },
  {
    label: 'Access Control',
    href: '#',
    icon: <Lock size={18} />,
    subItems: [
      { label: 'Access Policies', href: '/admin/access/policies', icon: null },
      { label: 'App Permissions', href: '/admin/access/permissions', icon: null },
      { label: 'Audit Log', href: '/admin/access/audit', icon: null },
    ],
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: <Settings size={18} />,
  },
]

function SidebarLink({
  item,
  isOpen,
  isExpanded,
  onToggle,
}: {
  item: MenuItem
  isOpen: boolean
  isExpanded?: boolean
  onToggle?: () => void
}) {
  const hasSubItems = item.subItems && item.subItems.length > 0

  if (!isOpen && hasSubItems) {
    return null
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-500 transition-all duration-150 ${
          isExpanded
            ? 'text-brand-600 bg-brand-50/10 border-l-2 border-brand-600'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/5'
        }`}
      >
        <span className="flex-shrink-0 opacity-75">{item.icon}</span>
        <span className="flex-1 text-left">{item.label}</span>
        {hasSubItems && (
          <ChevronDown
            size={16}
            className={`transition-transform opacity-50 ${isExpanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {hasSubItems && isExpanded && isOpen && (
        <div className="bg-slate-900/20">
          {item.subItems?.map((subItem) => (
            <Link
              key={subItem.href}
              href={subItem.href}
              className="block px-4 py-2 pl-12 text-xs text-slate-500 hover:text-brand-600 hover:bg-brand-50/5 transition-all duration-150 border-l border-slate-800/50"
            >
              {subItem.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [expandedMenu, setExpandedMenu] = useState<string | null>('Dashboard')

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-5 left-4 z-50 lg:hidden p-2 rounded-lg bg-slate-100/10 text-slate-600 hover:bg-slate-100/20 transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800/50 transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-20'
        } lg:relative lg:block hidden`}
      >
        {/* Branding */}
        <div className="p-6 border-b border-slate-800/50">
          <div className={`flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              S
            </div>
            {isOpen && (
              <div className="min-w-0">
                <div className="font-600 text-slate-100 text-sm leading-tight">Securelab</div>
                <div className="text-xs text-slate-400">Admin</div>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        {isOpen && (
          <div className="p-4 border-b border-slate-800/50">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
              />
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {menuItems.map((item) => (
            <SidebarLink
              key={item.label}
              item={item}
              isOpen={isOpen}
              isExpanded={expandedMenu === item.label}
              onToggle={() =>
                setExpandedMenu(expandedMenu === item.label ? null : item.label)
              }
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800/50 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-100 hover:bg-slate-800/50 rounded-lg transition-all duration-150">
            <Settings size={18} className="opacity-75" />
            {isOpen && <span>Settings</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all duration-150">
            <LogOut size={18} className="opacity-75" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
