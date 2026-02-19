import { createServerSupabaseAnonClient } from '@/lib/supabase/server'
import { AdminLayoutClient } from './layout-client'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseAnonClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <AdminLayoutClient userEmail={user?.email}>{children}</AdminLayoutClient>
}
