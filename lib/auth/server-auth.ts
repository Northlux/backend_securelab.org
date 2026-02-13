/**
 * Server-side authentication utilities
 * Provides secure authentication checks for server actions
 * Uses database-backed role validation (not JWT claims)
 */

import { createServerSupabaseAnonClient } from '@/lib/supabase/server'
import {
  AuthError,
  ForbiddenError,
  RateLimitError,
  ValidationError,
} from '@/lib/utils/error-handler'

export interface AuthUser {
  userId: string
  email: string
  role: 'admin' | 'analyst' | 'user'
}

// Re-export error classes for convenience
export { AuthError, ForbiddenError, RateLimitError, ValidationError }

/**
 * Get the currently authenticated user with role validation
 * ✅ Uses database role lookup (not JWT claims)
 * @throws AuthError if user is not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const supabase = await createServerSupabaseAnonClient()

  // Get current session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.id) {
    throw new AuthError('User not authenticated')
  }

  // Get user role from database (not from JWT claims)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    throw new AuthError('User profile not found')
  }

  // Validate role is one of allowed values
  const role = userData.role as 'admin' | 'analyst' | 'user'
  if (!['admin', 'analyst', 'user'].includes(role)) {
    throw new AuthError('Invalid user role')
  }

  return {
    userId: user.id,
    email: user.email || userData.email || '',
    role,
  }
}

/**
 * Require a specific role or throw ForbiddenError
 * @throws ForbiddenError if user doesn't have required role
 */
export async function requireRole(
  requiredRole: 'admin' | 'analyst' | 'user'
): Promise<AuthUser> {
  const user = await getCurrentUser()

  // Role hierarchy: admin > analyst > user
  const roleHierarchy: Record<string, number> = {
    admin: 3,
    analyst: 2,
    user: 1,
  }

  const userLevel = roleHierarchy[user.role] ?? 0
  const requiredLevel = roleHierarchy[requiredRole] ?? 0

  if (userLevel < requiredLevel) {
    throw new ForbiddenError(
      `This action requires ${requiredRole} role. You have ${user.role} role.`
    )
  }

  return user
}

/**
 * Require admin role or throw ForbiddenError
 */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole('admin')
}

/**
 * Require analyst or admin role
 */
export async function requireAnalystOrAdmin(): Promise<AuthUser> {
  return requireRole('analyst')
}

/**
 * Check if user has a specific role (non-throwing version)
 */
export async function hasRole(
  requiredRole: 'admin' | 'analyst' | 'user'
): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    const roleHierarchy: Record<string, number> = {
      admin: 3,
      analyst: 2,
      user: 1,
    }
    const userLevel = roleHierarchy[user.role] ?? 0
    const requiredLevel = roleHierarchy[requiredRole] ?? 0
    return userLevel >= requiredLevel
  } catch {
    return false
  }
}

/**
 * Get user role without throwing (returns 'user' for unauthenticated)
 */
export async function getUserRole(): Promise<'admin' | 'analyst' | 'user'> {
  try {
    const user = await getCurrentUser()
    return user.role
  } catch {
    return 'user'
  }
}

/**
 * Verify that operation is performed on user's own data or by admin
 * Used to prevent users from accessing/modifying other users' data
 */
export async function requireOwnerOrAdmin(
  targetUserId: string
): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (user.role !== 'admin' && user.userId !== targetUserId) {
    throw new ForbiddenError(
      'You can only access your own data. Admins can access any user data.'
    )
  }

  return user
}
