/**
 * Session Manager
 *
 * Handles user session tracking, validation, and revocation
 * Prevents session fixation and credential reuse attacks
 */

import { createServerSupabaseAnonClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export interface SessionData {
  id: string
  userId: string
  ipAddress: string
  userAgent: string
  createdAt: string
  lastActivityAt: string
  expiresAt: string
  isRevoked: boolean
}

/**
 * Hash IP address and User-Agent for session identification
 * Protects against session hijacking by detecting when device changes
 */
function hashSessionKey(ipAddress: string, userAgent: string): string {
  const combined = `${ipAddress}:${userAgent}`
  return createHash('sha256').update(combined).digest('hex')
}

/**
 * Create a new session record
 */
export async function createSession(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<SessionData | null> {
  try {
    const supabase = await createServerSupabaseAnonClient()
    const sessionHash = hashSessionKey(ipAddress, userAgent)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7-day session

    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_hash: sessionHash,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_revoked: false,
      })
      .select()
      .single()

    if (error) {
      console.error('[SessionManager] Failed to create session:', error)
      return null
    }

    return data as SessionData
  } catch (error) {
    console.error('[SessionManager] Error creating session:', error)
    return null
  }
}

/**
 * Validate an existing session
 * Checks if session exists, is not revoked, and not expired
 */
export async function validateSession(
  userId: string,
  sessionId: string,
  ipAddress: string,
  userAgent: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const supabase = await createServerSupabaseAnonClient()
    const sessionHash = hashSessionKey(ipAddress, userAgent)

    const { error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .eq('session_hash', sessionHash)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error) {
      return { valid: false, reason: 'Session not found or expired' }
    }

    // Update last activity time
    await supabase
      .from('user_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', sessionId)

    return { valid: true }
  } catch (error) {
    console.error('[SessionManager] Error validating session:', error)
    return { valid: false, reason: 'Validation error' }
  }
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseAnonClient()

    const { error } = await supabase
      .from('user_sessions')
      .update({ is_revoked: true })
      .eq('id', sessionId)

    if (error) {
      console.error('[SessionManager] Failed to revoke session:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[SessionManager] Error revoking session:', error)
    return false
  }
}

/**
 * Revoke all sessions for a user
 * Used when user changes password or logs out from all devices
 */
export async function revokeAllUserSessions(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseAnonClient()

    const { error } = await supabase
      .from('user_sessions')
      .update({ is_revoked: true })
      .eq('user_id', userId)

    if (error) {
      console.error('[SessionManager] Failed to revoke all sessions:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[SessionManager] Error revoking all sessions:', error)
    return false
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  try {
    const supabase = await createServerSupabaseAnonClient()

    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('last_activity_at', { ascending: false })

    if (error) {
      console.error('[SessionManager] Failed to fetch sessions:', error)
      return []
    }

    return (data || []) as SessionData[]
  } catch (error) {
    console.error('[SessionManager] Error fetching sessions:', error)
    return []
  }
}

/**
 * Clean up expired sessions (call from cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const supabase = await createServerSupabaseAnonClient()

    const { data, error: deleteError } = await supabase
      .from('user_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select()

    if (deleteError) {
      console.error('[SessionManager] Failed to cleanup expired sessions:', deleteError)
      return 0
    }

    const deletedCount = (data || []).length
    console.log(`[SessionManager] Cleaned up ${deletedCount} expired sessions`)
    return deletedCount
  } catch (error) {
    console.error('[SessionManager] Error cleaning up sessions:', error)
    return 0
  }
}

/**
 * Detect suspicious session activity
 * Returns true if device/IP change is detected
 */
export async function detectSuspiciousActivity(
  userId: string,
  currentIp: string,
  currentUserAgent: string
): Promise<{ suspicious: boolean; lastSeenIp?: string; lastSeenUserAgent?: string }> {
  try {
    const supabase = await createServerSupabaseAnonClient()

    // Get the most recent active session
    const { data, error } = await supabase
      .from('user_sessions')
      .select('ip_address, user_agent')
      .eq('user_id', userId)
      .eq('is_revoked', false)
      .order('last_activity_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      // No previous session found, not suspicious
      return { suspicious: false }
    }

    // Check if IP or User-Agent changed significantly
    const ipChanged = data.ip_address !== currentIp
    const userAgentChanged = data.user_agent !== currentUserAgent

    return {
      suspicious: ipChanged || userAgentChanged,
      lastSeenIp: data.ip_address,
      lastSeenUserAgent: data.user_agent,
    }
  } catch (error) {
    console.error('[SessionManager] Error detecting suspicious activity:', error)
    return { suspicious: false }
  }
}

/**
 * Check if user has concurrent sessions
 * Useful for detecting stolen credentials or account sharing
 */
export async function hasConcurrentSessions(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseAnonClient()

    const { data, error } = await supabase
      .from('user_sessions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())

    if (error) {
      console.error('[SessionManager] Error checking concurrent sessions:', error)
      return false
    }

    // More than one active session indicates concurrent sessions
    const sessionCount = data?.length || 0
    return sessionCount > 1
  } catch (error) {
    console.error('[SessionManager] Error checking concurrent sessions:', error)
    return false
  }
}

/**
 * Auto-logout inactive session
 * Call from middleware on each request
 */
export async function autoLogoutInactive(
  sessionId: string,
  inactivityTimeoutMinutes: number = 30
): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseAnonClient()

    // Get session details
    const { data, error } = await supabase
      .from('user_sessions')
      .select('last_activity_at')
      .eq('id', sessionId)
      .single()

    if (error || !data) {
      return false
    }

    const lastActivity = new Date(data.last_activity_at)
    const now = new Date()
    const inactiveMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)

    if (inactiveMinutes > inactivityTimeoutMinutes) {
      // Revoke inactive session
      await revokeSession(sessionId)
      console.log(`[SessionManager] Revoked inactive session ${sessionId}`)
      return true
    }

    return false
  } catch (error) {
    console.error('[SessionManager] Error checking inactivity:', error)
    return false
  }
}
