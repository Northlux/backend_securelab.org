import { TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Upgrade Requests | Admin',
  description: 'Review pending tier upgrade requests',
}

export default function UpgradeRequestsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-600/10 rounded-lg">
          <TrendingUp size={20} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Upgrade Requests</h1>
          <p className="text-sm text-slate-400">Review and approve tier upgrade requests</p>
        </div>
      </div>

      <div className="border border-slate-700/50 rounded-lg p-8 text-center text-slate-400">
        <p className="text-sm">Upgrade requests component coming soon</p>
      </div>
    </div>
  )
}
