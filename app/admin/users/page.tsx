import { Users } from 'lucide-react'
import UserPageClient from './page-client'

export const metadata = {
  title: 'User Management | Admin',
  description: 'Manage system users and permissions',
}

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-600/10 rounded-lg">
            <Users size={20} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">User Management</h1>
            <p className="text-sm text-slate-400">Manage system users, roles, and permissions</p>
          </div>
        </div>
      </div>

      {/* Client Component */}
      <UserPageClient />
    </div>
  )
}
