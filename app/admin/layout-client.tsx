'use client'

import { useState } from 'react'
import { Sidebar } from '@/app/components/sidebar'
import { Header } from '@/app/components/header'

export function AdminLayoutClient({
  children,
  userEmail,
}: {
  children: React.ReactNode
  userEmail?: string | null
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header userEmail={userEmail} onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-auto" role="main">
          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
