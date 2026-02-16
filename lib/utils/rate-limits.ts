/**
 * Rate limit configuration for all operations
 * Organized by operation type with sensible defaults
 */

export const RATE_LIMITS = {
  // ============================================================================
  // SIGNAL OPERATIONS
  // ============================================================================
  SIGNAL_CREATE: {
    max: 100,
    window: 60 * 60 * 1000, // 100 per hour
    description: 'Create signal',
  },
  SIGNAL_UPDATE: {
    max: 200,
    window: 60 * 60 * 1000, // 200 per hour
    description: 'Update signal',
  },
  SIGNAL_DELETE: {
    max: 50,
    window: 60 * 60 * 1000, // 50 per hour
    description: 'Delete signal',
  },
  SIGNAL_FEATURE: {
    max: 100,
    window: 60 * 60 * 1000, // 100 per hour
    description: 'Feature signal',
  },
  SIGNAL_VERIFY: {
    max: 100,
    window: 60 * 60 * 1000, // 100 per hour
    description: 'Verify signal',
  },
  SIGNAL_SEARCH: {
    max: 1000,
    window: 60 * 60 * 1000, // 1000 per hour (read operation, generous)
    description: 'Search signals',
  },

  // ============================================================================
  // SOURCE OPERATIONS
  // ============================================================================
  SOURCE_CREATE: {
    max: 50,
    window: 60 * 60 * 1000, // 50 per hour
    description: 'Create source',
  },
  SOURCE_UPDATE: {
    max: 100,
    window: 60 * 60 * 1000, // 100 per hour
    description: 'Update source',
  },
  SOURCE_DELETE: {
    max: 20,
    window: 60 * 60 * 1000, // 20 per hour
    description: 'Delete source',
  },
  SOURCE_LIST: {
    max: 1000,
    window: 60 * 60 * 1000, // 1000 per hour (read operation)
    description: 'List sources',
  },

  // ============================================================================
  // TAG OPERATIONS
  // ============================================================================
  TAG_CREATE: {
    max: 100,
    window: 60 * 60 * 1000, // 100 per hour
    description: 'Create tag',
  },
  TAG_UPDATE: {
    max: 100,
    window: 60 * 60 * 1000, // 100 per hour
    description: 'Update tag',
  },
  TAG_DELETE: {
    max: 50,
    window: 60 * 60 * 1000, // 50 per hour
    description: 'Delete tag',
  },
  TAG_LIST: {
    max: 1000,
    window: 60 * 60 * 1000, // 1000 per hour (read operation)
    description: 'List tags',
  },

  // ============================================================================
  // BULK OPERATIONS (MORE RESTRICTIVE)
  // ============================================================================
  BULK_DELETE: {
    max: 10,
    window: 60 * 60 * 1000, // 10 per hour
    description: 'Bulk delete',
  },
  BULK_UPDATE: {
    max: 10,
    window: 60 * 60 * 1000, // 10 per hour
    description: 'Bulk update',
  },
  BULK_FEATURE: {
    max: 10,
    window: 60 * 60 * 1000, // 10 per hour
    description: 'Bulk feature',
  },
  BULK_VERIFY: {
    max: 10,
    window: 60 * 60 * 1000, // 10 per hour
    description: 'Bulk verify',
  },

  // ============================================================================
  // IMPORT OPERATIONS (VERY RESTRICTIVE)
  // ============================================================================
  IMPORT_SIGNALS: {
    max: 5,
    window: 60 * 60 * 1000, // 5 per hour
    description: 'Import signals',
  },
  IMPORT_VALIDATE: {
    max: 50,
    window: 60 * 60 * 1000, // 50 per hour
    description: 'Validate import',
  },

  // ============================================================================
  // USER MANAGEMENT OPERATIONS (VERY RESTRICTIVE)
  // ============================================================================
  USER_UPDATE: {
    max: 100,
    window: 60 * 60 * 1000, // 100 per hour
    description: 'Update user',
  },
  USER_DELETE: {
    max: 10,
    window: 60 * 60 * 1000, // 10 per hour
    description: 'Delete user',
  },
  USER_SUSPEND: {
    max: 20,
    window: 60 * 60 * 1000, // 20 per hour
    description: 'Suspend user',
  },
  USER_UNSUSPEND: {
    max: 20,
    window: 60 * 60 * 1000, // 20 per hour
    description: 'Unsuspend user',
  },
  USER_BULK_UPDATE: {
    max: 5,
    window: 60 * 60 * 1000, // 5 per hour
    description: 'Bulk update users',
  },
  USER_BULK_SUSPEND: {
    max: 5,
    window: 60 * 60 * 1000, // 5 per hour
    description: 'Bulk suspend users',
  },

  // ============================================================================
  // SUBSCRIPTION OPERATIONS
  // ============================================================================
  SUBSCRIPTION_CREATE: {
    max: 50,
    window: 60 * 60 * 1000, // 50 per hour
    description: 'Create subscription',
  },
  SUBSCRIPTION_UPDATE: {
    max: 100,
    window: 60 * 60 * 1000, // 100 per hour
    description: 'Update subscription',
  },
  SUBSCRIPTION_CANCEL: {
    max: 20,
    window: 60 * 60 * 1000, // 20 per hour
    description: 'Cancel subscription',
  },
  SUBSCRIPTION_REFUND: {
    max: 10,
    window: 60 * 60 * 1000, // 10 per hour
    description: 'Refund subscription',
  },
  TIER_CREATE: {
    max: 20,
    window: 60 * 60 * 1000, // 20 per hour
    description: 'Create subscription tier',
  },
  TIER_UPDATE: {
    max: 50,
    window: 60 * 60 * 1000, // 50 per hour
    description: 'Update subscription tier',
  },
  TIER_DELETE: {
    max: 10,
    window: 60 * 60 * 1000, // 10 per hour
    description: 'Delete subscription tier',
  },
  UPGRADE_REQUEST_APPROVE: {
    max: 100,
    window: 60 * 60 * 1000, // 100 per hour
    description: 'Approve upgrade request',
  },
  UPGRADE_REQUEST_REJECT: {
    max: 100,
    window: 60 * 60 * 1000, // 100 per hour
    description: 'Reject upgrade request',
  },

  // ============================================================================
  // INGESTION LOG OPERATIONS
  // ============================================================================
  INGESTION_LIST: {
    max: 1000,
    window: 60 * 60 * 1000, // 1000 per hour (read operation)
    description: 'List ingestion logs',
  },

  // ============================================================================
  // STATS/ANALYTICS OPERATIONS
  // ============================================================================
  STATS_VIEW: {
    max: 1000,
    window: 60 * 60 * 1000, // 1000 per hour (read operation)
    description: 'View statistics',
  },
  SIGNAL_STATS: {
    max: 1000,
    window: 60 * 60 * 1000, // 1000 per hour (read operation)
    description: 'Signal statistics',
  },
  SIGNAL_CATEGORY: {
    max: 1000,
    window: 60 * 60 * 1000, // 1000 per hour (read operation)
    description: 'Signals by category',
  },
  SIGNAL_SEVERITY: {
    max: 1000,
    window: 60 * 60 * 1000, // 1000 per hour (read operation)
    description: 'Signals by severity',
  },
  SOURCE_STATS: {
    max: 1000,
    window: 60 * 60 * 1000, // 1000 per hour (read operation)
    description: 'Source statistics',
  },

  // ============================================================================
  // SUBSCRIPTION OPERATIONS (BILLING)
  // ============================================================================
  SUBSCRIPTION_LIST: {
    max: 500,
    window: 60 * 60 * 1000, // 500 per hour (read operation)
    description: 'List subscriptions',
  },
  SUBSCRIPTION_DELETE: {
    max: 20,
    window: 60 * 60 * 1000, // 20 per hour
    description: 'Delete subscription',
  },
  SUBSCRIPTION_TIERS: {
    max: 1000,
    window: 60 * 60 * 1000, // 1000 per hour (read operation)
    description: 'List subscription tiers',
  },
  SUBSCRIPTION_REQUESTS: {
    max: 100,
    window: 60 * 60 * 1000, // 100 per hour (read operation)
    description: 'List upgrade requests',
  },
  BILLING_HISTORY: {
    max: 500,
    window: 60 * 60 * 1000, // 500 per hour (read operation)
    description: 'View billing history',
  },

  // ============================================================================
  // USER MANAGEMENT - READ OPERATIONS
  // ============================================================================
  USER_LIST: {
    max: 100,
    window: 60 * 60 * 1000, // 100 per hour (read operation)
    description: 'List users',
  },
  USER_READ: {
    max: 500,
    window: 60 * 60 * 1000, // 500 per hour (read operation)
    description: 'Read user details',
  },

  // ============================================================================
  // AUDIT OPERATIONS
  // ============================================================================
  AUDIT_LOG_LIST: {
    max: 500,
    window: 60 * 60 * 1000, // 500 per hour (read operation)
    description: 'List audit logs',
  },
} as const

// Type for rate limit keys
export type RateLimitKey = keyof typeof RATE_LIMITS

/**
 * Get rate limit config for an operation
 */
export function getRateLimit(
  operation: RateLimitKey
): { max: number; window: number } {
  const limit = RATE_LIMITS[operation]
  if (!limit) {
    console.warn(`[RateLimit] Unknown operation: ${operation}`)
    // Default to generous limit for unknown operations
    return { max: 1000, window: 60 * 60 * 1000 }
  }
  return limit
}

/**
 * Create a rate limit key for a user operation
 */
export function createRateLimitKey(
  userId: string,
  operation: RateLimitKey
): string {
  return `${operation}:${userId}`
}

/**
 * Create a rate limit key for an IP-based operation (e.g., cron)
 */
export function createIpRateLimitKey(ip: string, operation: string): string {
  return `${operation}:ip:${ip}`
}
