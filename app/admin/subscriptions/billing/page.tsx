import { Receipt } from 'lucide-react'

export const metadata = {
  title: 'Billing History | Admin',
  description: 'View and manage billing transactions',
}

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-600/10 rounded-lg">
          <Receipt size={20} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Billing History</h1>
          <p className="text-sm text-slate-400">View transaction history and refunds</p>
        </div>
      </div>

      <div className="border border-slate-700/50 rounded-lg p-8 text-center text-slate-400">
        <p className="text-sm">Billing history component coming soon</p>
      </div>
    </div>
  )
}
