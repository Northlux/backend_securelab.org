import { Ban } from 'lucide-react'

export const metadata = {
  title: 'Suspended Users | Admin',
}

export default function SuspendedPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-600/10 rounded-lg">
          <Ban size={20} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Suspended Users</h1>
          <p className="text-sm text-slate-400">Manage suspended accounts</p>
        </div>
      </div>

      <div className="border border-slate-700/50 rounded-lg p-8 text-center text-slate-400">
        <p className="text-sm">Suspended users component coming soon</p>
      </div>
    </div>
  )
}
