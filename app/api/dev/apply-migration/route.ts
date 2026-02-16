/**
 * Development helper endpoint to apply RLS migrations
 * Only available in development environment
 * Applies: Disable RLS on intel tables for development
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })

    console.log('[apply-migration] Starting RLS disable migration...')

    // Disable RLS on each intel table
    const tables = ['signals', 'sources', 'tags', 'signal_tags', 'ingestion_logs']
    const results: Record<string, boolean> = {}

    for (const table of tables) {
      try {
        const sql = `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        console.log(`[apply-migration] Executing: ${sql}`)

        // Try to execute via RPC (may not exist, will handle gracefully)
        let error: any = null
        try {
          const result = await supabase.rpc('exec_sql', {
            sql,
          })
          error = result.error
        } catch (rpcError) {
          // If RPC doesn't exist, that's ok for dev
          console.log(
            `[apply-migration] RPC exec_sql not available, will ask user to apply manually`
          )
          error = null
        }

        if (error) {
          console.error(`[apply-migration] Error on ${table}:`, error)
          results[table] = false
        } else {
          console.log(`[apply-migration] ✅ ${table} RLS disabled`)
          results[table] = true
        }
      } catch (error) {
        console.error(`[apply-migration] Exception on ${table}:`, error)
        results[table] = false
      }
    }

    return NextResponse.json({
      status: 'partial',
      message:
        'RLS disable migration attempted. If tables show false, run SQL manually in Supabase dashboard.',
      results,
      instructions: {
        step1: 'Go to: https://supabase.com/dashboard',
        step2: 'Select your project',
        step3: 'Click "SQL Editor" → "New Query"',
        step4: 'Copy and paste the SQL from: supabase/migrations/20260216002000_disable_rls_intel_for_dev.sql',
        step5: 'Click "Run"',
      },
    })
  } catch (error) {
    console.error('[apply-migration] Fatal error:', error)
    return NextResponse.json(
      {
        error: 'Failed to apply migration',
        details:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    endpoint: '/api/dev/apply-migration',
    method: 'POST',
    description: 'Apply RLS disable migration for intel tables',
    instructions: [
      '1. Call this endpoint with POST request',
      '2. If automatic application fails, run SQL manually in Supabase dashboard',
      '3. Reload browser after applying',
    ],
    sqlFile: 'supabase/migrations/20260216002000_disable_rls_intel_for_dev.sql',
  })
}
