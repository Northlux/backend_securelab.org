import { redirect } from 'next/navigation'
import { createServerSupabaseAnonClient } from '@/lib/supabase/server'

export default async function Home() {
  // Check if user is authenticated
  const supabase = await createServerSupabaseAnonClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Redirect to dashboard if authenticated
    redirect('/admin')
  } else {
    // Redirect to login if not authenticated
    redirect('/login')
  }
}
