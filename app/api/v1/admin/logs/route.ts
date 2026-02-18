/**
 * Ingestion Logs API
 *
 * GET /api/v1/admin/logs — list recent ingestion logs
 *
 * Query params:
 *   ?limit=50         — max results (default 50)
 *   ?status=success   — filter by status
 *   ?source_id=<uuid> — filter by source
 */
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const params = request.nextUrl.searchParams

  const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200)
  const status = params.get('status')
  const sourceId = params.get('source_id')

  let query = supabase
    .from('ingestion_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  if (sourceId) {
    query = query.eq('source_id', sourceId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data || [] })
}
