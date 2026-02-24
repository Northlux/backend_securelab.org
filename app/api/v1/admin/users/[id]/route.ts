import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/admin/users/[id]
 * Get single user details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Fetch user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch user sessions
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', id)
      .gt('expires_at', new Date().toISOString())
      .order('last_activity_at', { ascending: false })

    // Fetch recent audit logs
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      user,
      sessions: sessions || [],
      auditLogs: auditLogs || [],
    })
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/v1/admin/users/[id]
 * Update user profile, role, or status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Parse request body
    const body = await request.json()
    const { role, status, full_name, avatar_url, metadata } = body

    // Build update object
    const updates: Record<string, unknown> = {}
    if (role !== undefined) updates.role = role
    if (status !== undefined) updates.status = status
    if (full_name !== undefined) updates.full_name = full_name
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (metadata !== undefined) updates.metadata = metadata

    // Prevent admins from demoting themselves
    if (id === authUser.id && role && role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot change your own admin role' },
        { status: 400 }
      )
    }

    // Update user
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[API] Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: authUser.id,
      action: 'user_updated',
      resource_type: 'user',
      resource_id: id,
      metadata: {
        changes: updates,
        admin_id: authUser.id,
        admin_email: authUser.email,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/admin/users/[id]
 * Suspend user account (soft delete)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Prevent admins from suspending themselves
    if (id === authUser.id) {
      return NextResponse.json(
        { error: 'Cannot suspend your own account' },
        { status: 400 }
      )
    }

    // Suspend user
    const { data: user, error } = await supabase
      .from('users')
      .update({ status: 'suspended' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[API] Error suspending user:', error)
      return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 })
    }

    // Revoke all active sessions
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', id)
      .gt('expires_at', new Date().toISOString())

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: authUser.id,
      action: 'user_suspended',
      resource_type: 'user',
      resource_id: id,
      metadata: {
        admin_id: authUser.id,
        admin_email: authUser.email,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
