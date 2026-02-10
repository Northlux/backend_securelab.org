'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const UpdateUserSchema = z.object({
  role: z.enum(['admin', 'analyst', 'user']),
  status: z.enum(['active', 'suspended', 'pending']),
})

const SuspendUserSchema = z.object({
  reason: z.string().min(5).max(500),
})

export interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
    role?: string
  }
  created_at: string
  last_sign_in_at?: string
  status?: 'active' | 'suspended' | 'pending'
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
}

/**
 * Get paginated list of users with optional filtering
 */
export async function getUsers(
  page = 1,
  pageSize = 20,
  _filters?: {
    role?: string
    status?: string
    search?: string
  }
): Promise<UserListResponse> {
  // Note: For now, return empty list - integrate with Supabase auth when available
  // In production, would query auth.users() with Supabase Admin API
  try {
    return {
      users: [],
      total: 0,
      page,
      pageSize,
    }
  } catch (error) {
    console.error('Error fetching users:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error('Failed to fetch users')
  }
}

/**
 * Get single user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('User fetch error:', error.message)
      return null
    }

    return data as User
  } catch (error) {
    console.error('Error fetching user:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

/**
 * Update user role and status
 */
export async function updateUser(
  userId: string,
  data: z.infer<typeof UpdateUserSchema>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    // Validate input
    const validated = UpdateUserSchema.parse(data)

    // Update user metadata (role) and status
    const { error } = await supabase
      .from('users')
      .update({
        status: validated.status,
        user_metadata: {
          role: validated.role,
        },
      })
      .eq('id', userId)

    if (error) {
      console.error('User update error:', error.message)
      return { success: false, error: 'Failed to update user' }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Invalid data provided' : 'Failed to update user'
    return { success: false, error: message }
  }
}

/**
 * Suspend user account
 */
export async function suspendUser(
  userId: string,
  data: z.infer<typeof SuspendUserSchema>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    // Validate input
    const validated = SuspendUserSchema.parse(data)

    // Update user status and add suspension reason
    const { error } = await supabase
      .from('users')
      .update({
        status: 'suspended',
        metadata: {
          suspended_at: new Date().toISOString(),
          suspension_reason: validated.reason,
        },
      })
      .eq('id', userId)

    if (error) {
      console.error('User suspension error:', error.message)
      return { success: false, error: 'Failed to suspend user' }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Invalid data provided' : 'Failed to suspend user'
    return { success: false, error: message }
  }
}

/**
 * Unsuspend user account
 */
export async function unsuspendUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    const { error } = await supabase
      .from('users')
      .update({
        status: 'active',
        metadata: {
          unsuspended_at: new Date().toISOString(),
        },
      })
      .eq('id', userId)

    if (error) {
      console.error('User unsuspension error:', error.message)
      return { success: false, error: 'Failed to unsuspend user' }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to unsuspend user' }
  }
}

/**
 * Delete user account
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('User deletion error:', error.message)
      return { success: false, error: 'Failed to delete user' }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete user' }
  }
}

/**
 * Get pending verification users
 */
export async function getPendingUsers(
  page = 1,
  pageSize = 20
): Promise<UserListResponse> {
  const supabase = await createServerSupabaseClient()

  try {
    const from = (page - 1) * pageSize

    const { data, count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('status', 'pending')
      .range(from, from + pageSize - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending users:', error.message)
      return { users: [], total: 0, page, pageSize }
    }

    return {
      users: (data || []) as User[],
      total: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    console.error('Error fetching pending users:', error instanceof Error ? error.message : 'Unknown error')
    return { users: [], total: 0, page, pageSize }
  }
}

/**
 * Get suspended users
 */
export async function getSuspendedUsers(
  page = 1,
  pageSize = 20
): Promise<UserListResponse> {
  const supabase = await createServerSupabaseClient()

  try {
    const from = (page - 1) * pageSize

    const { data, count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('status', 'suspended')
      .range(from, from + pageSize - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching suspended users:', error.message)
      return { users: [], total: 0, page, pageSize }
    }

    return {
      users: (data || []) as User[],
      total: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    console.error('Error fetching suspended users:', error instanceof Error ? error.message : 'Unknown error')
    return { users: [], total: 0, page, pageSize }
  }
}

/**
 * Bulk update user roles
 */
export async function bulkUpdateUserRoles(
  userIds: string[],
  role: 'admin' | 'analyst' | 'user'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    const { error } = await supabase
      .from('users')
      .update({
        user_metadata: {
          role,
        },
      })
      .in('id', userIds)

    if (error) {
      console.error('Bulk update error:', error.message)
      return { success: false, error: 'Failed to update users' }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update users' }
  }
}

/**
 * Bulk suspend users
 */
export async function bulkSuspendUsers(
  userIds: string[],
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    const { error } = await supabase
      .from('users')
      .update({
        status: 'suspended',
        metadata: {
          suspended_at: new Date().toISOString(),
          suspension_reason: reason,
        },
      })
      .in('id', userIds)

    if (error) {
      console.error('Bulk suspend error:', error.message)
      return { success: false, error: 'Failed to suspend users' }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to suspend users' }
  }
}
