import { User } from 'lucide-react'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import { getUserById } from '@/app/actions/users'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'User Detail | Admin',
}

// UUID validation schema
const UUIDSchema = z.string().uuid('Invalid user ID format')

export default async function UserDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  // Await the params (Next.js 15 requirement)
  const params = await props.params

  // Validate UUID format
  const validationResult = UUIDSchema.safeParse(params.id)
  if (!validationResult.success) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-slate-400">Invalid user ID</p>
      </div>
    )
  }

  // Authenticate user
  const supabase = await createServerSupabaseClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // Check authorization (admin role required)
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (!userData || userData.role !== 'admin') {
    redirect('/login')
  }

  // Fetch the requested user
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
