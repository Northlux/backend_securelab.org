'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { serverLog, handleDatabaseError } from '@/lib/utils/logger'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import { logUserAction } from '@/lib/utils/audit-logger'

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
 * SECURITY: Rate limited to prevent enumeration attacks (OWASP A10)
 */
export async function getUserById(userId: string): Promise<User | null> {
  const supabase = await createServerSupabaseClient()

  // Check rate limit: max 30 requests per minute per user
  const rateLimitKey = `get-user:${userId}`
  const rateLimit = checkRateLimit(rateLimitKey, 30, 60 * 1000)

  if (!rateLimit.allowed) {
    serverLog(
      'warn',
      'getUserById',
      `Rate limit exceeded for user lookup (${rateLimitKey}). Reset in ${rateLimit.resetSeconds}s`
    )
    return null
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      serverLog('warn', 'getUserById', `User not found: ${userId}`)
      return null
    }

    return data as User
  } catch (error) {
    handleDatabaseError('getUserById', error, 'fetch')
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
      serverLog('error', 'updateUser', `User update failed for ${userId}`, { error: error.message })
      return { success: false, error: 'Failed to update user' }
    }

    // Log audit trail
    await logUserAction(userId, 'user_role_change', undefined, { role: validated.role, status: validated.status })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Invalid data provided' : 'Failed to update user'
    serverLog('error', 'updateUser', message, { error })
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
      serverLog('error', 'suspendUser', `User suspension failed for ${userId}`, { error: error.message })
      return { success: false, error: 'Failed to suspend user' }
    }

    // Log audit trail
    await logUserAction(userId, 'user_suspend', validated.reason)

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Invalid data provided' : 'Failed to suspend user'
    serverLog('error', 'suspendUser', message, { error })
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
      serverLog('error', 'unsuspendUser', `User unsuspension failed for ${userId}`, { error: error.message })
      return { success: false, error: 'Failed to unsuspend user' }
    }

    // Log audit trail
    await logUserAction(userId, 'user_unsuspend')

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    serverLog('error', 'unsuspendUser', 'Unexpected error unsuspending user', { error })
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
      serverLog('error', 'deleteUser', `User deletion failed for ${userId}`, { error: error.message })
      return { success: false, error: 'Failed to delete user' }
    }

    // Log audit trail
    await logUserAction(userId, 'user_delete')

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    serverLog('error', 'deleteUser', 'Unexpected error deleting user', { error })
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
      serverLog('error', 'getPendingUsers', 'Database query failed', { error: error.message })
      return { users: [], total: 0, page, pageSize }
    }

    return {
      users: (data || []) as User[],
      total: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    serverLog('error', 'getPendingUsers', 'Failed to fetch pending users', { error })
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
      serverLog('error', 'getSuspendedUsers', 'Database query failed', { error: error.message })
      return { users: [], total: 0, page, pageSize }
    }

    return {
      users: (data || []) as User[],
      total: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    serverLog('error', 'getSuspendedUsers', 'Failed to fetch suspended users', { error })
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
      serverLog('error', 'bulkUpdateUserRoles', `Bulk role update failed for ${userIds.length} users`, { error: error.message })
      return { success: false, error: 'Failed to update users' }
    }

    // Log audit trail for each user
    for (const userId of userIds) {
      await logUserAction(userId, 'user_role_change', `Bulk update to ${role}`, { role })
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    serverLog('error', 'bulkUpdateUserRoles', 'Unexpected error in bulk update', { error })
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
      serverLog('error', 'bulkSuspendUsers', `Bulk suspend failed for ${userIds.length} users`, { error: error.message })
      return { success: false, error: 'Failed to suspend users' }
    }

    // Log audit trail for each user
    for (const userId of userIds) {
      await logUserAction(userId, 'user_suspend', reason)
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    serverLog('error', 'bulkSuspendUsers', 'Unexpected error in bulk suspend', { error })
    return { success: false, error: 'Failed to suspend users' }
  }
}
