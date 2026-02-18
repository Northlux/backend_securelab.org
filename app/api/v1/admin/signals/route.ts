import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const params = request.nextUrl.searchParams

  const status = params.get('status')
  const category = params.get('category')
  const severity = params.get('severity')
  const search = params.get('search')
  const sort = params.get('sort') || 'date'
  const order = params.get('order') || 'desc'
  const page = parseInt(params.get('page') || '1', 10)
  const limit = Math.min(parseInt(params.get('limit') || '20', 10), 100)
  const offset = (page - 1) * limit

  // Build the query — join signals with triage_results
  let query = supabase
    .from('signals')
    .select(`
      *,
      triage_results (
        id,
        kimi_score,
        kimi_reason,
        openai_score,
        openai_reason,
        triage_status,
        processed_summary,
        polished_content,
        created_at
      )
    `, { count: 'exact' })

  // Status filter
  if (status === 'pending') {
    // Signals with no triage result — we'll filter client-side after fetch
    // Supabase doesn't support IS NULL on joined tables easily via query builder
    // So we use a different approach: fetch all and filter
  } else if (status && status !== 'all') {
    query = query.eq('triage_results.triage_status', status)
  }

  // Category filter
  if (category) {
    query = query.eq('signal_category', category)
  }

  // Severity filter
  if (severity) {
    query = query.eq('severity', severity)
  }

  // Search
  if (search) {
    query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`)
  }

  // Sorting
  if (sort === 'date') {
    query = query.order('created_at', { ascending: order === 'asc' })
  } else if (sort === 'severity') {
    query = query.order('severity', { ascending: order === 'asc' })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // For 'pending' status, we need to fetch more and filter
  if (status === 'pending') {
    const { data, error } = await query.range(0, 999)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter to only signals with no triage result
    const pending = (data || []).filter(
      (s: Record<string, unknown>) => {
        const tr = s.triage_results
        return !tr || (Array.isArray(tr) && tr.length === 0)
      }
    )

    const paged = pending.slice(offset, offset + limit)
    return NextResponse.json({
      data: paged,
      pagination: {
        page,
        limit,
        total: pending.length,
        totalPages: Math.ceil(pending.length / limit),
      },
    })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If filtering by status (non-pending), some signals may have triage_results
  // that don't match — filter those out
  let filtered = data || []
  if (status && status !== 'all' && status !== 'pending') {
    filtered = filtered.filter((s: Record<string, unknown>) => {
      const tr = s.triage_results
      if (Array.isArray(tr)) return tr.length > 0
      return tr !== null
    })
  }

  return NextResponse.json({
    data: filtered,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}
