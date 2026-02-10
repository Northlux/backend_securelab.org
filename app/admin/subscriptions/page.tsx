import { CreditCard } from 'lucide-react'
import SubscriptionPageClient from './page-client'

export const metadata = {
  title: 'Subscriptions | Admin',
  description: 'Manage user subscriptions and billing',
}

export default function SubscriptionsPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-600/10 rounded-lg">
            <CreditCard size={20} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Subscriptions</h1>
            <p className="text-sm text-slate-400">Manage active subscriptions and billing</p>
          </div>
        </div>
      </div>

      {/* Client Component */}
      <SubscriptionPageClient />
    </div>
  )
}
