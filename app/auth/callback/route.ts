import { createServerSupabaseAnonClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth callback handler for email verification
 * Processes the email confirmation link sent to users
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/admin'

  if (code) {
    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    new URL('/auth/error?error=Could not verify email', request.url)
  )
}
