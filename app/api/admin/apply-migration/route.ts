import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/admin'
import fs from 'fs'
import path from 'path'

/**
 * Apply database migrations
 * This endpoint is protected and should only be called during setup
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { migration } = await request.json()

    if (!migration) {
      return NextResponse.json(
        { error: 'Migration name required' },
        { status: 400 }
      )
    }

    // Get admin client
    const supabase = await createServerSupabaseAdminClient()

    // Read migration file
    const migrationPath = path.join(
      process.cwd(),
      'supabase/migrations',
      migration
    )

    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        { error: `Migration file not found: ${migration}` },
        { status: 404 }
      )
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8')

    // Execute migration - split by statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))

    let results = []
    for (const statement of statements) {
      const { data, error } = await supabase.rpc('exec', {
        sql: statement
      })

      if (error && error.code !== 'PGRST202') {
        // PGRST202 = function not found, try alternative
        console.error(`Error executing statement: ${error.message}`)
      }
      results.push({ statement: statement.substring(0, 50), success: !error })
    }

    return NextResponse.json({
      success: true,
      message: `Applied migration: ${migration}`,
      results
    })
  } catch (error) {
    console.error('[apply-migration]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
