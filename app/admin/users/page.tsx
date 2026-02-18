import { Users } from 'lucide-react'

export default function UsersPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-600 text-slate-100 mb-1">User Management</h1>
        <p className="text-sm text-slate-500">Manage platform users, roles, and permissions</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-slate-800/40 border border-slate-800 rounded-lg">
        <Users size={48} className="text-slate-700 mb-4" />
        <h2 className="text-lg font-600 text-slate-400 mb-2">Coming Soon</h2>
        <p className="text-sm text-slate-500 max-w-md text-center">
          User management, role assignment, and access control will be available
          once the subscription system is implemented.
        </p>
      </div>
    </>
  )
}
