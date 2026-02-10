import { User } from 'lucide-react'
import { getUserById } from '@/app/actions/users'

export const metadata = {
  title: 'User Detail | Admin',
}

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const user = await getUserById(params.id)

  if (!user) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-slate-400">User not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-600/10 rounded-lg">
          <User size={20} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">User Details</h1>
          <p className="text-sm text-slate-400">{user.email}</p>
        </div>
      </div>

      <div className="border border-slate-700/50 rounded-lg p-8 text-center text-slate-400">
        <p className="text-sm">User detail component coming soon</p>
      </div>
    </div>
  )
}
