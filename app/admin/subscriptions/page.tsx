import type { Metadata } from 'next'
import { CreditCard } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Subscriptions — Securelab Admin',
}

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Subscriptions</h1>
        <p className="text-sm text-slate-500 mt-1">Manage subscription tiers, billing, and access</p>
      </div>

      <Card className="bg-slate-800/40 border-slate-800">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <CreditCard size={28} className="text-slate-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-300 mb-1">Coming Soon</h2>
          <p className="text-sm text-slate-500 max-w-md text-center mb-4">
            Subscription tiers, billing integration, and upgrade management
            are planned for Phase 2.
          </p>
          <Link
            href="/admin"
            className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            Go to Dashboard →
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
