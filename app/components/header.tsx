'use client'

import { useState } from 'react'
import { Bell, Settings, ChevronDown, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

interface HeaderProps {
  userEmail?: string | null
}

export function Header({ userEmail }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
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
    <header className="bg-slate-950 border-b border-slate-800/50 sticky top-0 z-30">
      <div className="flex items-center justify-between px-8 py-5">
        {/* Breadcrumb / Title - Left side */}
        <div className="flex items-center gap-2">
          <nav className="text-sm text-slate-500">
            <span className="text-slate-100 font-500">Dashboard</span>
            <span className="mx-3 text-slate-700">/</span>
            <span>Overview</span>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button className="relative p-2.5 text-slate-600 hover:text-slate-400 hover:bg-slate-800/50 rounded-lg transition-all duration-150">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2.5 text-slate-600 hover:text-slate-400 hover:bg-slate-800/50 rounded-lg transition-all duration-150">
            <Settings size={18} />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-800/50 mx-2"></div>

          {/* User Menu with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800/50 transition-all duration-150 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-sm font-600 flex-shrink-0">
                {userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-500 text-slate-100 truncate max-w-[120px]">
                  {userEmail || 'User'}
                </div>
                <div className="text-xs text-slate-500">Admin</div>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-600 group-hover:text-slate-400 transition-all ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-700 text-xs text-slate-500">
                  {userEmail}
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <LogOut size={16} />
                  {loggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
