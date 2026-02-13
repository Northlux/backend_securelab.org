'use server'

import { createServerSupabaseAnonClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser, requireAdmin } from '@/lib/auth/server-auth'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import { logUserAction } from '@/lib/utils/audit-logger'
import { isValidUuid } from '@/lib/utils/sanitize'
import { createRateLimitKey, getRateLimit, type RateLimitKey } from '@/lib/utils/rate-limits'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  status: 'active' | 'suspended' | 'deleted'
  role: 'admin' | 'user' | 'viewer'
  created_at: string
  updated_at: string | null
  last_login_at: string | null
}

// Validation schemas
const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

const RoleSchema = z.enum(['admin', 'user', 'viewer'])

/**
 * Get paginated list of users
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 * ✅ Input validation: Pagination
 */
export async function getUsers(page: number = 1, pageSize: number = 20) {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Input validation
    const validatedPagination = PaginationSchema.parse({ page, pageSize })

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'USER_LIST' as RateLimitKey),
      getRateLimit('USER_LIST' as RateLimitKey).max,
      getRateLimit('USER_LIST' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const from = (validatedPagination.page - 1) * validatedPagination.pageSize

    const supabase = await createServerSupabaseAnonClient()
    const { data, count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .range(from, from + validatedPagination.pageSize - 1)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      data: (data || []) as UserProfile[],
      count: count || 0,
    }
  } catch (error) {
    console.error('[getUsers] Error:', error)
    throw error
  }
}

/**
 * Get user by ID
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 * ✅ Input validation: UUID
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Input validation
    if (!isValidUuid(userId)) {
      throw new Error('Invalid user ID format')
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'USER_LIST' as RateLimitKey),
      getRateLimit('USER_LIST' as RateLimitKey).max,
      getRateLimit('USER_LIST' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return (data || null) as UserProfile | null
  } catch (error) {
    console.error('[getUserById] Error:', error)
    throw error
  }
}

/**
 * Update user role
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 100/hour (write operation)
 * ✅ Input validation: UUID + role enum
 */
export async function updateUserRole(
  userId: string,
  role: 'admin' | 'user' | 'viewer'
): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    if (!isValidUuid(userId)) {
      throw new Error('Invalid user ID format')
    }
    const validatedRole = RoleSchema.parse(role)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'USER_UPDATE' as RateLimitKey),
      getRateLimit('USER_UPDATE' as RateLimitKey).max,
      getRateLimit('USER_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('users')
      .update({ role: validatedRole })
      .eq('id', userId)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'user_role_change', 'user', userId, {
      role: validatedRole,
    })

    revalidatePath('/admin/users')
  } catch (error) {
    console.error('[updateUserRole] Error:', error)
    throw error
  }
}

/**
 * Suspend user
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 100/hour (write operation)
 * ✅ Input validation: UUID
 */
export async function suspendUser(userId: string): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    if (!isValidUuid(userId)) {
      throw new Error('Invalid user ID format')
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'USER_UPDATE' as RateLimitKey),
      getRateLimit('USER_UPDATE' as RateLimitKey).max,
      getRateLimit('USER_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('users')
      .update({ status: 'suspended' })
      .eq('id', userId)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'user_suspend', 'user', userId)

    revalidatePath('/admin/users')
  } catch (error) {
    console.error('[suspendUser] Error:', error)
    throw error
  }
}

/**
 * Unsuspend user
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 100/hour (write operation)
 * ✅ Input validation: UUID
 */
export async function unsuspendUser(userId: string): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    if (!isValidUuid(userId)) {
      throw new Error('Invalid user ID format')
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'USER_UPDATE' as RateLimitKey),
      getRateLimit('USER_UPDATE' as RateLimitKey).max,
      getRateLimit('USER_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', userId)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'user_unsuspend', 'user', userId)

    revalidatePath('/admin/users')
  } catch (error) {
    console.error('[unsuspendUser] Error:', error)
    throw error
  }
}

/**
 * Delete user (soft delete)
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 50/hour (dangerous operation)
 * ✅ Input validation: UUID
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    if (!isValidUuid(userId)) {
      throw new Error('Invalid user ID format')
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'USER_DELETE' as RateLimitKey),
      getRateLimit('USER_DELETE' as RateLimitKey).max,
      getRateLimit('USER_DELETE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    // Soft-delete: set status to 'deleted'
    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('users')
      .update({ status: 'deleted' })
      .eq('id', userId)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'user_delete', 'user', userId)

    revalidatePath('/admin/users')
  } catch (error) {
    console.error('[deleteUser] Error:', error)
    throw error
  }
}

/**
 * Get audit logs for a user
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 * ✅ Input validation: UUID + pagination
 */
export async function getAuditLogs(userId: string, page: number = 1, pageSize: number = 20) {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Input validation
    if (!isValidUuid(userId)) {
      throw new Error('Invalid user ID format')
    }
    const validatedPagination = PaginationSchema.parse({ page, pageSize })

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'AUDIT_LOG_LIST' as RateLimitKey),
      getRateLimit('AUDIT_LOG_LIST' as RateLimitKey).max,
      getRateLimit('AUDIT_LOG_LIST' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, count, error } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(
        (validatedPagination.page - 1) * validatedPagination.pageSize,
        validatedPagination.page * validatedPagination.pageSize - 1
      )

    if (error) throw error

    return {
      data: data || [],
      count: count || 0,
    }
  } catch (error) {
    console.error('[getAuditLogs] Error:', error)
    throw error
  }
}
