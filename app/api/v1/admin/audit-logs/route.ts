import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/admin/audit-logs
 * List audit logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if user is admin
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminCheck } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const action = searchParams.get('action') || ''
    const userId = searchParams.get('userId') || ''
    const resourceType = searchParams.get('resourceType') || ''
    const from = searchParams.get('from') || '' // ISO date string
    const to = searchParams.get('to') || '' // ISO date string

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*, users!audit_logs_user_id_fkey(email, full_name)', { count: 'exact' })

    // Apply filters
    if (action) {
      query = query.eq('action', action)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }

    if (from) {
      query = query.gte('created_at', from)
    }

    if (to) {
      query = query.lte('created_at', to)
    }

    // Apply sorting (always descending by created_at)
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    const offset = (page - 1) * limit
    const end = offset + limit - 1
    query = query.range(offset, end)

    const { data: logs, error, count } = await query

    if (error) {
      console.error('[API] Error fetching audit logs:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      data: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
