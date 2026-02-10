/**
 * Audit Logger for sensitive operations
 *
 * SECURITY: Tracks who did what, when, and why
 * OWASP A09: Logging & Monitoring - Audit trail for accountability
 *
 * Logs to audit_logs table in database for persistent record
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

export type AuditAction =
  | 'subscription_cancel'
  | 'subscription_refund'
  | 'subscription_upgrade_approve'
  | 'subscription_upgrade_reject'
  | 'user_role_change'
  | 'user_suspend'
  | 'user_unsuspend'
  | 'user_delete'

export interface AuditLogEntry {
  action: AuditAction
  userId: string
  targetId: string // ID of resource being modified
  targetType: 'subscription' | 'user' | 'upgrade_request'
  changes?: Record<string, unknown>
  reason?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an action to audit trail
 * Failures are logged but don't block the operation
 */
export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.warn('[AUDIT] No authenticated user for audit log')
      return
    }

    // Insert audit log
    const { error } = await supabase.from('audit_logs').insert([
      {
        action: entry.action,
        admin_id: user.id,
        target_id: entry.targetId,
        target_type: entry.targetType,
        changes: entry.changes,
        reason: entry.reason,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.warn('[AUDIT] Failed to log action:', error.message)
      // Don't throw - audit failure shouldn't block operation
    }
  } catch (error) {
    console.warn('[AUDIT] Error logging action:', error)
    // Silently fail - audit logging shouldn't block main operation
  }
}

/**
 * Convenience function to log subscription action
 */
export async function logSubscriptionAction(
  subscriptionId: string,
  action: Extract<AuditAction, 'subscription_cancel' | 'subscription_refund' | 'subscription_upgrade_approve' | 'subscription_upgrade_reject'>,
  reason?: string,
  changes?: Record<string, unknown>
): Promise<void> {
  await logAuditAction({
    action,
    userId: 'unknown', // Will be overwritten by authenticated user
    targetId: subscriptionId,
    targetType: 'subscription',
    changes,
    reason,
  })
}

/**
 * Convenience function to log user action
 */
export async function logUserAction(
  userId: string,
  action: Extract<AuditAction, 'user_role_change' | 'user_suspend' | 'user_unsuspend' | 'user_delete'>,
  reason?: string,
  changes?: Record<string, unknown>
): Promise<void> {
  await logAuditAction({
    action,
    userId: 'unknown', // Will be overwritten by authenticated user
    targetId: userId,
    targetType: 'user',
    changes,
    reason,
  })
}
