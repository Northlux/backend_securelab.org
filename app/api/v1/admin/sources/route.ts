/**
 * Sources API — manage data feed sources
 *
 * GET  /api/v1/admin/sources       — list all sources with filters
 * POST /api/v1/admin/sources       — create a new source
 *
 * Query params:
 *   ?type=rss|api|scraper|manual   — filter by source type
 *   ?active=true|false             — filter by active status
 *   ?search=<query>                — search by name/url
 */
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const params = request.nextUrl.searchParams

  const type = params.get('type')
  const active = params.get('active')
  const search = params.get('search')

  let query = supabase
    .from('sources')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })

  if (type) {
    query = query.eq('source_type', type)
  }

  if (active === 'true') {
    query = query.eq('is_active', true)
  } else if (active === 'false') {
    query = query.eq('is_active', false)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,url.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const body = await request.json()

  const { name, url, source_type, is_active } = body as {
    name: string
    url: string
    source_type: string
    is_active?: boolean
  }

  if (!name || !source_type) {
    return NextResponse.json(
      { error: 'name and source_type are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('sources')
    .insert({
      name,
      url: url || '',
      source_type,
      is_active: is_active !== false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
