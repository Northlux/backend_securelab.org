import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

/**
 * Emergency RLS fix endpoint
 * Drops the problematic "Only backend can modify users" policy
 * This is a temporary workaround for development
 */
export async function POST() {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    // Create client with service role to execute SQL
    const supabase = createServerClient(supabaseUrl, serviceKey, {
      cookies: {
        get() {
          return ''
        },
        set() {},
        remove() {},
      },
    })

    // Execute the RLS fix
    // Note: We can't execute arbitrary SQL via the REST API,
    // so we'll use a stored function approach if available
    console.log('[fix-rls] Attempting to fix RLS policy...')

    // Try to call a stored function that applies the fix
    const { data, error } = await supabase.rpc('fix_users_rls_policy')

    if (error) {
      console.error('[fix-rls] RPC error:', error)
      return NextResponse.json(
        {
          error: 'Could not apply RLS fix via API',
          hint: 'Please apply the migration manually via Supabase dashboard:\n' +
                'supabase/migrations/20260216000000_fix_users_rls_policy.sql',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'RLS policy fixed successfully',
      data,
    })
  } catch (error) {
    console.error('[fix-rls] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint - returns instructions for fixing RLS
 */
export async function GET() {
  return NextResponse.json({
    message: 'RLS Policy Fix Endpoint',
    instructions: [
      '1. Go to Supabase dashboard',
      '2. Open SQL Editor',
      '3. Paste and run this command:',
      '   DROP POLICY IF EXISTS "Only backend can modify users" ON public.users;',
      '',
      'Or use the migration file:',
      'supabase/migrations/20260216000000_fix_users_rls_policy.sql',
    ],
    endpoint: 'POST /api/admin/fix-rls',
  })
}
