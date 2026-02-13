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
  // User actions
  | 'user_role_change'
  | 'user_suspend'
  | 'user_unsuspend'
  | 'user_delete'
  | 'bulk_update_user_roles'
  | 'bulk_suspend_users'
  // Subscription actions
  | 'subscription_cancel'
  | 'subscription_refund'
  | 'subscription_upgrade_approve'
  | 'subscription_upgrade_reject'
  | 'subscription_tier_create'
  | 'subscription_tier_update'
  | 'subscription_tier_delete'
  // Signal actions
  | 'signal_create'
  | 'signal_update'
  | 'signal_delete'
  | 'signal_toggle_verification'
  | 'signal_toggle_featured'
  | 'signal_verify'
  | 'signal_feature'
  | 'signal_severity_update'
  | 'signal_update_severity'
  | 'signal_tag_add'
  | 'signal_tag_remove'
  | 'bulk_delete_signals'
  | 'bulk_update_severity'
  | 'bulk_add_tags'
  | 'bulk_remove_tags'
  | 'bulk_mark_verified'
  | 'bulk_unmark_verified'
  // Source actions
  | 'source_create'
  | 'source_update'
  | 'source_delete'
  | 'source_toggle'
  // Tag actions
  | 'tag_create'
  | 'tag_update'
  | 'tag_delete'
  // Log actions
  | 'ingestion_log_create'
  | 'ingestion_log_update'
  | 'ingestion_log_delete'
  // Cron actions
  | 'cron_hourly_executed'
  | 'cron_daily_executed'

export interface AuditLogEntry {
  action: AuditAction
  userId: string
  targetId: string // ID of resource being modified
  targetType: 'subscription' | 'user' | 'upgrade_request' | 'signal' | 'source' | 'tag' | 'log' | 'system' | string
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
 * Convenience function to log any action (generic)
 * Supports all action types with flexible parameters
 */
export async function logUserAction(
  callingUserId: string,
  action: AuditAction,
  targetType?: string,
  targetId?: string,
  changes?: Record<string, unknown>,
  reason?: string
): Promise<void> {
  // Determine target type based on action if not provided
  let resolvedTargetType = targetType || 'user'

  // Map actions to their target types
  if (!targetType) {
    if (action.includes('subscription')) {
      resolvedTargetType = 'subscription'
    } else if (action.includes('signal') || action.includes('bulk')) {
      resolvedTargetType = 'signal'
    } else if (action.includes('source')) {
      resolvedTargetType = 'source'
    } else if (action.includes('tag')) {
      resolvedTargetType = 'tag'
    } else if (action.includes('ingestion_log')) {
      resolvedTargetType = 'log'
    } else if (action.includes('cron')) {
      resolvedTargetType = 'system'
    }
  }

  await logAuditAction({
    action,
    userId: callingUserId,
    targetId: targetId || callingUserId,
    targetType: (resolvedTargetType || 'user') as any,
    changes,
    reason,
  })
}
