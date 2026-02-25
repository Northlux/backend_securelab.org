// API route: GET/POST /api/v1/admin/groups
// List all groups or create new group

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/v1/admin/groups - List all groups
export async function GET(_request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: user } = await supabase
      .from('users')
      .select('groups')
      .eq('id', session.user.id)
      .single()

    if (!user || !user.groups?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Fetch all groups with their permissions
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .order('sort_order', { ascending: true })

    if (groupsError) {
      console.error('Error fetching groups:', groupsError)
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
    }

    // Fetch permission counts per group
    const { data: permissions } = await supabase
      .from('group_permissions')
      .select('group_name, subdomain, permission')

    // Count users per group
    const { data: users } = await supabase.from('users').select('groups')

    const groupStats = groups.map((group) => {
      const userCount = users?.filter((u) => u.groups?.includes(group.name)).length || 0
      const permissionCount =
        permissions?.filter((p) => p.group_name === group.name).length || 0

      return {
        ...group,
        userCount,
        permissionCount,
      }
    })

    return NextResponse.json({
      data: groupStats,
      total: groupStats.length,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/admin/groups - Create new group
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: user } = await supabase
      .from('users')
      .select('groups')
      .eq('id', session.user.id)
      .single()

    if (!user || !user.groups?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { name, display_name, description, color, icon } = body

    if (!name || !display_name) {
      return NextResponse.json(
        { error: 'Missing required fields: name, display_name' },
        { status: 400 }
      )
    }

    // Validate group name (alphanumeric + hyphen/underscore only)
    if (!/^[a-z0-9_-]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Group name must be lowercase alphanumeric with hyphens/underscores only' },
        { status: 400 }
      )
    }

    // Create group
    const { data: newGroup, error: createError } = await supabase
      .from('groups')
      .insert({
        name,
        display_name,
        description: description || null,
        color: color || 'slate',
        icon: icon || 'Users',
      })
      .select()
      .single()

    if (createError) {
      if (createError.code === '23505') {
        // Unique violation
        return NextResponse.json({ error: 'Group name already exists' }, { status: 409 })
      }
      console.error('Error creating group:', createError)
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'group_created',
      resource: `group:${newGroup.name}`,
      metadata: { group_name: newGroup.name, display_name: newGroup.display_name },
    })

    return NextResponse.json({ data: newGroup }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
