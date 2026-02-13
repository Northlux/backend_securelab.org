'use server'

import { createServerSupabaseAnonClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser, requireAdmin } from '@/lib/auth/server-auth'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import { logUserAction } from '@/lib/utils/audit-logger'
import { isValidUuid } from '@/lib/utils/sanitize'
import { createRateLimitKey, getRateLimit, type RateLimitKey } from '@/lib/utils/rate-limits'

// Validation schemas
const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

const UpdateUserSchema = z.object({
  role: z.enum(['admin', 'analyst', 'user']),
  status: z.enum(['active', 'suspended', 'pending']),
})

const SuspendUserSchema = z.object({
  reason: z.string().min(5).max(500),
})

const BulkUserIdsSchema = z.array(z.string().uuid()).min(1).max(1000)

const BulkSuspendSchema = z.object({
  userIds: BulkUserIdsSchema,
  reason: z.string().min(5).max(500),
})

const BulkRoleSchema = z.object({
  userIds: BulkUserIdsSchema,
  role: z.enum(['admin', 'analyst', 'user']),
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
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 * ✅ Input validation: Pagination
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

    let query = (await createServerSupabaseAnonClient())
      .from('users')
      .select('*', { count: 'exact' })
      .range(from, from + validatedPagination.pageSize - 1)
      .order('created_at', { ascending: false })

    // Apply filters if provided
    if (_filters?.status) {
      query = query.eq('status', _filters.status)
    }
    if (_filters?.role) {
      query = query.eq('user_metadata->>role', _filters.role)
    }

    const { data, count, error } = await query

    if (error) throw error

    return {
      users: (data || []) as User[],
      total: count || 0,
      page: validatedPagination.page,
      pageSize: validatedPagination.pageSize,
    }
  } catch (error) {
    console.error('[getUsers] Error:', error)
    throw error
  }
}

/**
 * Get single user by ID
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation, per-user enumeration protection)
 * ✅ Input validation: UUID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Input validation
    if (!isValidUuid(userId)) {
      throw new Error('Invalid user ID format')
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'USER_READ' as RateLimitKey),
      getRateLimit('USER_READ' as RateLimitKey).max,
      getRateLimit('USER_READ' as RateLimitKey).window
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

    return data as User
  } catch (error) {
    console.error('[getUserById] Error:', error)
    throw error
  }
}

/**
 * Update user role and status
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 100/hour (write operation)
 * ✅ Input validation: Zod schema + UUID
 */
export async function updateUser(
  userId: string,
  userData: z.infer<typeof UpdateUserSchema>
): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    if (!isValidUuid(userId)) {
      throw new Error('Invalid user ID format')
    }
    const validated = UpdateUserSchema.parse(userData)

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

    // Update user metadata (role) and status
    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('users')
      .update({
        status: validated.status,
        user_metadata: {
          role: validated.role,
        },
      })
      .eq('id', userId)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'user_role_change', 'user', userId, {
      role: validated.role,
      status: validated.status,
    })

    revalidatePath('/admin/users')
  } catch (error) {
    console.error('[updateUser] Error:', error)
    throw error
  }
}

/**
 * Suspend user account
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 100/hour (write operation)
 * ✅ Input validation: Zod schema + UUID
 */
export async function suspendUser(
  userId: string,
  suspendData: z.infer<typeof SuspendUserSchema>
): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    if (!isValidUuid(userId)) {
      throw new Error('Invalid user ID format')
    }
    const validated = SuspendUserSchema.parse(suspendData)

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

    // Update user status and add suspension reason
    const supabase = await createServerSupabaseAnonClient()
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

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'user_suspend', 'user', userId, {
      reason: validated.reason,
    })

    revalidatePath('/admin/users')
  } catch (error) {
    console.error('[suspendUser] Error:', error)
    throw error
  }
}

/**
 * Unsuspend user account
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
      .update({
        status: 'active',
        metadata: {
          unsuspended_at: new Date().toISOString(),
        },
      })
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
 * Delete user account
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

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('users')
      .delete()
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
 * Get pending verification users
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 * ✅ Input validation: Pagination
 */
export async function getPendingUsers(
  page = 1,
  pageSize = 20
): Promise<UserListResponse> {
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
      .eq('status', 'pending')
      .range(from, from + validatedPagination.pageSize - 1)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      users: (data || []) as User[],
      total: count || 0,
      page: validatedPagination.page,
      pageSize: validatedPagination.pageSize,
    }
  } catch (error) {
    console.error('[getPendingUsers] Error:', error)
    throw error
  }
}

/**
 * Get suspended users
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 * ✅ Input validation: Pagination
 */
export async function getSuspendedUsers(
  page = 1,
  pageSize = 20
): Promise<UserListResponse> {
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
      .eq('status', 'suspended')
      .range(from, from + validatedPagination.pageSize - 1)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      users: (data || []) as User[],
      total: count || 0,
      page: validatedPagination.page,
      pageSize: validatedPagination.pageSize,
    }
  } catch (error) {
    console.error('[getSuspendedUsers] Error:', error)
    throw error
  }
}

/**
 * Bulk update user roles
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 10/hour (very restrictive - bulk operation)
 * ✅ Input validation: Zod schema with UUID array
 */
export async function bulkUpdateUserRoles(
  userIds: string[],
  role: 'admin' | 'analyst' | 'user'
): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    const validated = BulkRoleSchema.parse({ userIds, role })

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'BULK_UPDATE' as RateLimitKey),
      getRateLimit('BULK_UPDATE' as RateLimitKey).max,
      getRateLimit('BULK_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('users')
      .update({
        user_metadata: {
          role: validated.role,
        },
      })
      .in('id', validated.userIds)

    if (error) throw error

    // Audit log for bulk operation
    await logUserAction(user.userId, 'bulk_update_user_roles', 'user', undefined, {
      count: validated.userIds.length,
      role: validated.role,
    })

    revalidatePath('/admin/users')
  } catch (error) {
    console.error('[bulkUpdateUserRoles] Error:', error)
    throw error
  }
}

/**
 * Bulk suspend users
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 10/hour (very restrictive - bulk operation)
 * ✅ Input validation: Zod schema with UUID array
 */
export async function bulkSuspendUsers(
  userIds: string[],
  reason: string
): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    const validated = BulkSuspendSchema.parse({ userIds, reason })

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'BULK_UPDATE' as RateLimitKey),
      getRateLimit('BULK_UPDATE' as RateLimitKey).max,
      getRateLimit('BULK_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('users')
      .update({
        status: 'suspended',
        metadata: {
          suspended_at: new Date().toISOString(),
          suspension_reason: validated.reason,
        },
      })
      .in('id', validated.userIds)

    if (error) throw error

    // Audit log for bulk operation
    await logUserAction(user.userId, 'bulk_suspend_users', 'user', undefined, {
      count: validated.userIds.length,
      reason: validated.reason,
    })

    revalidatePath('/admin/users')
  } catch (error) {
    console.error('[bulkSuspendUsers] Error:', error)
    throw error
  }
}
