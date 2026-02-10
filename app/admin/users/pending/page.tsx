import { Clock } from 'lucide-react'

export const metadata = {
  title: 'Pending Users | Admin',
  description: 'Manage users pending email verification',
}

export default function PendingUsersPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-600/10 rounded-lg">
          <Clock size={20} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Pending Verification</h1>
          <p className="text-sm text-slate-400">Users awaiting email verification</p>
        </div>
      </div>

      <div className="border border-slate-700/50 rounded-lg p-8 text-center text-slate-400">
        <p className="text-sm">Pending users component coming soon</p>
      </div>
    </div>
  )
}
