import { Package } from 'lucide-react'
import TiersPageClient from './page-client'

export const metadata = {
  title: 'Subscription Tiers | Admin',
  description: 'Manage subscription tier definitions',
}

export default function TiersPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-600/10 rounded-lg">
            <Package size={20} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Subscription Tiers</h1>
            <p className="text-sm text-slate-400">Create and manage subscription tier definitions</p>
          </div>
        </div>
      </div>

      {/* Client Component */}
      <TiersPageClient />
    </div>
  )
}
