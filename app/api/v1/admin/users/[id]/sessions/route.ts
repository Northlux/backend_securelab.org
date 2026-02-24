import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/admin/users/[id]/sessions
 * List all sessions for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

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

    // Fetch sessions
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', id)
      .order('last_activity_at', { ascending: false })

    if (error) {
      console.error('[API] Error fetching sessions:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/admin/users/[id]/sessions
 * Revoke all sessions for a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

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

    // Delete all sessions
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', id)

    if (error) {
      console.error('[API] Error revoking sessions:', error)
      return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 })
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: authUser.id,
      action: 'user_sessions_revoked',
      resource_type: 'user',
      resource_id: id,
      metadata: {
        admin_id: authUser.id,
        admin_email: authUser.email,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
