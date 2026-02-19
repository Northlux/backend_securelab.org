import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'User Management — Securelab Admin',
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage platform users, roles, and permissions</p>
      </div>

      <Card className="bg-slate-800/40 border-slate-800">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <Users size={28} className="text-slate-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-300 mb-1">Coming Soon</h2>
          <p className="text-sm text-slate-500 max-w-md text-center mb-4">
            User management, role assignment, and access control will be available
            once the subscription system is implemented.
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
