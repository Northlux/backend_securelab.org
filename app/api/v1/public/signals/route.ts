/**
 * Public Signals API — serves curated, approved content
 *
 * This is the endpoint that intel.securelab.org and other frontends
 * should consume. Only returns editorially approved signals with
 * polished content and AI enrichment.
 *
 * GET /api/v1/public/signals
 *
 * Query params:
 *   ?category=vulnerability    — filter by category
 *   ?severity=critical         — filter by severity
 *   ?featured=true             — only featured signals
 *   ?search=<query>            — search title/summary
 *   ?limit=20                  — results per page (max 100)
 *   ?page=1                    — page number
 *   ?sort=score|date|priority  — sort order
 *
 * Response:
 * {
 *   data: Signal[],
 *   pagination: { page, limit, total, totalPages }
 * }
 *
 * No authentication required — this is public data.
 */
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Cache for 60 seconds
export const revalidate = 60

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const params = request.nextUrl.searchParams

  const category = params.get('category')
  const severity = params.get('severity')
  const featured = params.get('featured')
  const search = params.get('search')
  const sort = params.get('sort') || 'date'
  const page = parseInt(params.get('page') || '1', 10)
  const limit = Math.min(parseInt(params.get('limit') || '20', 10), 100)
  const offset = (page - 1) * limit

  let query = supabase
    .from('curated_signals')
    .select('*', { count: 'exact' })

  if (category) {
    query = query.eq('signal_category', category)
  }

  if (severity) {
    query = query.eq('severity', severity)
  }

  if (featured === 'true') {
    query = query.eq('is_featured', true)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`)
  }

  // Sorting
  if (sort === 'score') {
    query = query.order('relevance_score', { ascending: false })
  } else if (sort === 'priority') {
    query = query.order('display_priority', { ascending: true })
      .order('relevance_score', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Strip internal fields from public response
  const cleaned = (data || []).map((signal) => ({
    id: signal.id,
    title: signal.title,
    summary: signal.summary,
    content: signal.polished_content || signal.processed_summary || signal.summary,
    category: signal.signal_category,
    severity: signal.severity,
    source_url: signal.source_url,
    source_date: signal.source_date,
    cve_ids: signal.cve_ids,
    threat_actors: signal.threat_actors,
    affected_products: signal.affected_products,
    target_industries: signal.target_industries,
    is_featured: signal.is_featured,
    is_verified: signal.is_verified,
    image_url: signal.image_url,
    relevance_score: signal.relevance_score,
    created_at: signal.created_at,
  }))

  return NextResponse.json({
    data: cleaned,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}
