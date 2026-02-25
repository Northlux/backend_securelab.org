// API route: PATCH /api/v1/admin/users/[id]/groups
// Add or remove groups from a user

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// PATCH /api/v1/admin/users/[id]/groups - Add or remove groups
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params
    const supabase = createServerSupabaseClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: currentUser } = await supabase
      .from('users')
      .select('groups')
      .eq('id', session.user.id)
      .single()

    if (!currentUser || !currentUser.groups?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { action, group } = body

    if (!action || !group) {
      return NextResponse.json({ error: 'Missing required fields: action, group' }, { status: 400 })
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "add" or "remove"' }, { status: 400 })
    }

    // Get target user
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, groups')
      .eq('id', userId)
      .single()

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent self-demotion (removing own admin group)
    if (userId === session.user.id && action === 'remove' && group === 'admin') {
      return NextResponse.json(
        { error: 'Cannot remove your own admin group' },
        { status: 403 }
      )
    }

    // Verify group exists
    const { data: groupExists } = await supabase
      .from('groups')
      .select('name')
      .eq('name', group)
      .single()

    if (!groupExists) {
      return NextResponse.json({ error: 'Group does not exist' }, { status: 404 })
    }

    let newGroups = targetUser.groups || []

    if (action === 'add') {
      // Add group if not already present
      if (!newGroups.includes(group)) {
        newGroups.push(group)
      } else {
        return NextResponse.json({ error: 'User already has this group' }, { status: 400 })
      }
    } else {
      // Remove group
      const initialLength = newGroups.length
      newGroups = newGroups.filter((g: string) => g !== group)
      
      if (newGroups.length === initialLength) {
        return NextResponse.json({ error: 'User does not have this group' }, { status: 400 })
      }

      // Ensure at least 'users' group remains
      if (newGroups.length === 0) {
        newGroups = ['users']
      }
    }

    // Update user groups
    const { error: updateError } = await supabase
      .from('users')
      .update({ groups: newGroups })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user groups:', updateError)
      return NextResponse.json({ error: 'Failed to update user groups' }, { status: 500 })
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: `group_${action}`,
      resource: `user:${userId}`,
      metadata: {
        target_user: targetUser.email,
        group: group,
        new_groups: newGroups,
      },
    })

    return NextResponse.json({
      message: `Group ${action === 'add' ? 'added' : 'removed'} successfully`,
      groups: newGroups,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/v1/admin/users/[id]/groups - Get user's groups with details
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params
    const supabase = createServerSupabaseClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: currentUser } = await supabase
      .from('users')
      .select('groups')
      .eq('id', session.user.id)
      .single()

    if (!currentUser || !currentUser.groups?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get target user
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, groups')
      .eq('id', userId)
      .single()

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get group details
    const { data: groupDetails } = await supabase
      .from('groups')
      .select('*')
      .in('name', targetUser.groups || [])

    // Get permissions for user's groups
    const { data: permissions } = await supabase
      .from('group_permissions')
      .select('*')
      .in('group_name', targetUser.groups || [])

    return NextResponse.json({
      userId: targetUser.id,
      email: targetUser.email,
      groups: targetUser.groups,
      groupDetails: groupDetails || [],
      permissions: permissions || [],
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
