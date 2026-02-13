'use server'

import { createServerSupabaseAnonClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser, requireAdmin } from '@/lib/auth/server-auth'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import { logUserAction } from '@/lib/utils/audit-logger'
import { isValidUuid, sanitizeStringArray } from '@/lib/utils/sanitize'
import { createRateLimitKey, getRateLimit, type RateLimitKey } from '@/lib/utils/rate-limits'

// Validation schemas
const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

const FilterSchema = z.object({
  status: z.string().optional(),
  tier_id: z.string().uuid().optional(),
  search: z.string().optional(),
})

const CreateTierSchema = z.object({
  name: z.string().min(2).max(50),
  price_monthly: z.number().min(0).max(10000),
  price_annual: z.number().min(0).max(100000),
  description: z.string().max(500),
  features: z.array(z.string()),
  is_active: z.boolean().default(true),
  display_order: z.number().default(0),
})

const UpdateTierSchema = CreateTierSchema.partial().required({ name: true })

const CancelSubscriptionSchema = z.object({
  reason: z.string().min(5).max(500),
  refund_amount: z.number().min(0).optional(),
})

const RefundSchema = z.object({
  amount: z.number().min(0),
  reason: z.string().min(5).max(500),
})

const UpgradeRequestActionSchema = z.object({
  notes: z.string().max(500).optional(),
  reason: z.string().max(500).optional(),
})

const BillingHistoryFilterSchema = z.object({
  status: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
})

export interface SubscriptionTier {
  id: string
  name: string
  price_monthly: number
  price_annual: number
  description: string
  features: string[]
  is_active: boolean
  user_count: number
  display_order: number
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  tier_id: string
  status: 'active' | 'canceled' | 'expired'
  started_at: string
  current_period_end: string
  canceled_at?: string
  cancellation_reason?: string
  price: number
  billing_cycle: 'monthly' | 'annual'
  user_email?: string
  tier_name?: string
}

export interface SubscriptionListResponse {
  subscriptions: Subscription[]
  total: number
  page: number
  pageSize: number
}

/**
 * Get paginated list of subscriptions with filtering
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 * ✅ Input validation: Pagination and filters
 */
export async function getSubscriptions(
  page = 1,
  pageSize = 20,
  filters?: {
    status?: string
    tier_id?: string
    search?: string
  }
): Promise<SubscriptionListResponse> {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Input validation
    const validatedPagination = PaginationSchema.parse({ page, pageSize })
    const validatedFilters = FilterSchema.parse(filters || {})

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SUBSCRIPTION_LIST' as RateLimitKey),
      getRateLimit('SUBSCRIPTION_LIST' as RateLimitKey).max,
      getRateLimit('SUBSCRIPTION_LIST' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const from = (validatedPagination.page - 1) * validatedPagination.pageSize

    let query = (await createServerSupabaseAnonClient())
      .from('subscriptions')
      .select('*, users(email), subscription_tiers(name)', { count: 'exact' })
      .range(from, from + validatedPagination.pageSize - 1)
      .order('created_at', { ascending: false })

    // Apply filters
    if (validatedFilters.status) {
      query = query.eq('status', validatedFilters.status)
    }
    if (validatedFilters.tier_id) {
      query = query.eq('tier_id', validatedFilters.tier_id)
    }

    const { data, count, error } = await query

    if (error) throw error

    const subscriptions = (data || []).map((sub: any) => ({
      ...sub,
      user_email: sub.users?.email,
      tier_name: sub.subscription_tiers?.name,
    })) as Subscription[]

    return {
      subscriptions,
      total: count || 0,
      page: validatedPagination.page,
      pageSize: validatedPagination.pageSize,
    }
  } catch (error) {
    console.error('[getSubscriptions] Error:', error)
    throw error
  }
}

/**
 * Get single subscription by ID
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 * ✅ Input validation: UUID validation
 */
export async function getSubscriptionById(subscriptionId: string): Promise<Subscription | null> {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Input validation
    if (!isValidUuid(subscriptionId)) {
      throw new Error('Invalid subscription ID format')
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SUBSCRIPTION_LIST' as RateLimitKey),
      getRateLimit('SUBSCRIPTION_LIST' as RateLimitKey).max,
      getRateLimit('SUBSCRIPTION_LIST' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, users(email, user_metadata), subscription_tiers(name, price_monthly, price_annual, features)')
      .eq('id', subscriptionId)
      .single()

    if (error) throw error

    return {
      ...data,
      user_email: data.users?.email,
      tier_name: data.subscription_tiers?.name,
    } as Subscription
  } catch (error) {
    console.error('[getSubscriptionById] Error:', error)
    throw error
  }
}

/**
 * Get all subscription tiers
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 */
export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SUBSCRIPTION_TIERS' as RateLimitKey),
      getRateLimit('SUBSCRIPTION_TIERS' as RateLimitKey).max,
      getRateLimit('SUBSCRIPTION_TIERS' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select(`
        *,
        subscriptions(count)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    return (data || []).map((tier: any) => ({
      ...tier,
      user_count: tier.subscriptions?.length || 0,
    })) as SubscriptionTier[]
  } catch (error) {
    console.error('[getSubscriptionTiers] Error:', error)
    throw error
  }
}

/**
 * Create new subscription tier
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 100/hour (write operation)
 * ✅ Input validation: Zod schema
 */
export async function createSubscriptionTier(
  tierData: z.infer<typeof CreateTierSchema>
): Promise<SubscriptionTier> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    const validated = CreateTierSchema.parse(tierData)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SUBSCRIPTION_CREATE' as RateLimitKey),
      getRateLimit('SUBSCRIPTION_CREATE' as RateLimitKey).max,
      getRateLimit('SUBSCRIPTION_CREATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    // Sanitize features array
    const sanitizedFeatures = sanitizeStringArray(validated.features)

    const supabase = await createServerSupabaseAnonClient()
    const { data: tier, error } = await supabase
      .from('subscription_tiers')
      .insert([{ ...validated, features: sanitizedFeatures }])
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'subscription_tier_create', 'subscription_tier', tier?.id, {
      name: validated.name,
      price: validated.price_monthly,
    })

    revalidatePath('/admin/subscriptions/tiers')
    return tier as SubscriptionTier
  } catch (error) {
    console.error('[createSubscriptionTier] Error:', error)
    throw error
  }
}

/**
 * Update subscription tier
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 100/hour (write operation)
 * ✅ Input validation: Zod schema + UUID
 */
export async function updateSubscriptionTier(
  tierId: string,
  tierData: z.infer<typeof UpdateTierSchema>
): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    if (!isValidUuid(tierId)) {
      throw new Error('Invalid tier ID format')
    }
    const validated = UpdateTierSchema.parse(tierData)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SUBSCRIPTION_UPDATE' as RateLimitKey),
      getRateLimit('SUBSCRIPTION_UPDATE' as RateLimitKey).max,
      getRateLimit('SUBSCRIPTION_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    // Sanitize features if provided
    const sanitizedData = {
      ...validated,
      features: validated.features ? sanitizeStringArray(validated.features) : undefined,
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('subscription_tiers')
      .update(sanitizedData)
      .eq('id', tierId)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'subscription_tier_update', 'subscription_tier', tierId, {
      name: validated.name,
    })

    revalidatePath('/admin/subscriptions/tiers')
  } catch (error) {
    console.error('[updateSubscriptionTier] Error:', error)
    throw error
  }
}

/**
 * Delete subscription tier (soft delete)
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 50/hour (dangerous operation)
 * ✅ Input validation: UUID
 */
export async function deleteSubscriptionTier(tierId: string): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    if (!isValidUuid(tierId)) {
      throw new Error('Invalid tier ID format')
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SUBSCRIPTION_DELETE' as RateLimitKey),
      getRateLimit('SUBSCRIPTION_DELETE' as RateLimitKey).max,
      getRateLimit('SUBSCRIPTION_DELETE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    // Soft delete by setting is_active = false
    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('subscription_tiers')
      .update({ is_active: false })
      .eq('id', tierId)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'subscription_tier_delete', 'subscription_tier', tierId)

    revalidatePath('/admin/subscriptions/tiers')
  } catch (error) {
    console.error('[deleteSubscriptionTier] Error:', error)
    throw error
  }
}

/**
 * Cancel subscription
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 100/hour (write operation)
 * ✅ Input validation: Zod schema + UUID
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelData: z.infer<typeof CancelSubscriptionSchema>
): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    if (!isValidUuid(subscriptionId)) {
      throw new Error('Invalid subscription ID format')
    }
    const validated = CancelSubscriptionSchema.parse(cancelData)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SUBSCRIPTION_UPDATE' as RateLimitKey),
      getRateLimit('SUBSCRIPTION_UPDATE' as RateLimitKey).max,
      getRateLimit('SUBSCRIPTION_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        cancellation_reason: validated.reason,
      })
      .eq('id', subscriptionId)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'subscription_cancel', 'subscription', subscriptionId, {
      reason: validated.reason,
    })

    revalidatePath('/admin/subscriptions')
  } catch (error) {
    console.error('[cancelSubscription] Error:', error)
    throw error
  }
}

/**
 * Process refund for subscription
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 100/hour (write operation)
 * ✅ Input validation: Zod schema + UUID
 */
export async function refundSubscription(
  subscriptionId: string,
  refundData: z.infer<typeof RefundSchema>
): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    if (!isValidUuid(subscriptionId)) {
      throw new Error('Invalid subscription ID format')
    }
    const validated = RefundSchema.parse(refundData)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SUBSCRIPTION_UPDATE' as RateLimitKey),
      getRateLimit('SUBSCRIPTION_UPDATE' as RateLimitKey).max,
      getRateLimit('SUBSCRIPTION_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    // Record refund in billing history
    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('billing_history')
      .insert([
        {
          subscription_id: subscriptionId,
          type: 'refund',
          amount: -Math.abs(validated.amount), // Negative for refund
          status: 'completed',
          notes: validated.reason,
          created_at: new Date().toISOString(),
        },
      ])

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'subscription_refund', 'subscription', subscriptionId, {
      amount: validated.amount,
      reason: validated.reason,
    })

    revalidatePath('/admin/subscriptions')
  } catch (error) {
    console.error('[refundSubscription] Error:', error)
    throw error
  }
}

/**
 * Get upgrade requests
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 * ✅ Input validation: Pagination and filters
 */
export async function getUpgradeRequests(
  page = 1,
  pageSize = 20,
  filters?: {
    status?: string
  }
): Promise<SubscriptionListResponse> {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Input validation
    const validatedPagination = PaginationSchema.parse({ page, pageSize })
    const validatedFilters = z.object({ status: z.string().optional() }).parse(filters || {})

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SUBSCRIPTION_REQUESTS' as RateLimitKey),
      getRateLimit('SUBSCRIPTION_REQUESTS' as RateLimitKey).max,
      getRateLimit('SUBSCRIPTION_REQUESTS' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const from = (validatedPagination.page - 1) * validatedPagination.pageSize

    let query = (await createServerSupabaseAnonClient())
      .from('upgrade_requests')
      .select('*, users(email), from_tier:subscription_tiers!from_tier_id(name), to_tier:subscription_tiers!to_tier_id(name)', {
        count: 'exact',
      })
      .range(from, from + validatedPagination.pageSize - 1)
      .order('created_at', { ascending: false })

    if (validatedFilters.status) {
      query = query.eq('status', validatedFilters.status)
    }

    const { data, count, error } = await query

    if (error) throw error

    return {
      subscriptions: (data || []) as any,
      total: count || 0,
      page: validatedPagination.page,
      pageSize: validatedPagination.pageSize,
    }
  } catch (error) {
    console.error('[getUpgradeRequests] Error:', error)
    throw error
  }
}

/**
 * Approve upgrade request
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 100/hour (write operation)
 * ✅ Input validation: UUID + optional notes
 */
export async function approveUpgradeRequest(
  requestId: string,
  actionData?: z.infer<typeof UpgradeRequestActionSchema>
): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    if (!isValidUuid(requestId)) {
      throw new Error('Invalid request ID format')
    }
    const validated = UpgradeRequestActionSchema.parse(actionData || {})

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SUBSCRIPTION_UPDATE' as RateLimitKey),
      getRateLimit('SUBSCRIPTION_UPDATE' as RateLimitKey).max,
      getRateLimit('SUBSCRIPTION_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('upgrade_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        admin_notes: validated.notes,
      })
      .eq('id', requestId)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'subscription_upgrade_approve', 'upgrade_request', requestId, {
      notes: validated.notes,
    })

    revalidatePath('/admin/subscriptions/requests')
  } catch (error) {
    console.error('[approveUpgradeRequest] Error:', error)
    throw error
  }
}

/**
 * Reject upgrade request
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 100/hour (write operation)
 * ✅ Input validation: UUID + reason
 */
export async function rejectUpgradeRequest(
  requestId: string,
  rejectData: z.infer<typeof UpgradeRequestActionSchema>
): Promise<void> {
  try {
    // Auth check
    const user = await requireAdmin()

    // Input validation
    if (!isValidUuid(requestId)) {
      throw new Error('Invalid request ID format')
    }
    const validated = UpgradeRequestActionSchema.parse(rejectData)

    if (!validated.reason) {
      throw new Error('Rejection reason is required')
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SUBSCRIPTION_UPDATE' as RateLimitKey),
      getRateLimit('SUBSCRIPTION_UPDATE' as RateLimitKey).max,
      getRateLimit('SUBSCRIPTION_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('upgrade_requests')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: validated.reason,
      })
      .eq('id', requestId)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'subscription_upgrade_reject', 'upgrade_request', requestId, {
      reason: validated.reason,
    })

    revalidatePath('/admin/subscriptions/requests')
  } catch (error) {
    console.error('[rejectUpgradeRequest] Error:', error)
    throw error
  }
}

/**
 * Get billing history
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 * ✅ Input validation: Pagination and date filters
 */
export async function getBillingHistory(
  page = 1,
  pageSize = 50,
  filters?: {
    status?: string
    date_from?: string
    date_to?: string
  }
): Promise<SubscriptionListResponse> {
  try {
    // Auth check
    const user = await getCurrentUser()

    // Input validation
    const validatedPagination = z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(50),
    }).parse({ page, pageSize })
    const validatedFilters = BillingHistoryFilterSchema.parse(filters || {})

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'BILLING_HISTORY' as RateLimitKey),
      getRateLimit('BILLING_HISTORY' as RateLimitKey).max,
      getRateLimit('BILLING_HISTORY' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const from = (validatedPagination.page - 1) * validatedPagination.pageSize

    let query = (await createServerSupabaseAnonClient())
      .from('billing_history')
      .select('*, subscriptions(users(email))', { count: 'exact' })
      .range(from, from + validatedPagination.pageSize - 1)
      .order('created_at', { ascending: false })

    if (validatedFilters.status) {
      query = query.eq('status', validatedFilters.status)
    }
    if (validatedFilters.date_from) {
      query = query.gte('created_at', validatedFilters.date_from)
    }
    if (validatedFilters.date_to) {
      query = query.lte('created_at', validatedFilters.date_to)
    }

    const { data, count, error } = await query

    if (error) throw error

    return {
      subscriptions: (data || []) as any,
      total: count || 0,
      page: validatedPagination.page,
      pageSize: validatedPagination.pageSize,
    }
  } catch (error) {
    console.error('[getBillingHistory] Error:', error)
    throw error
  }
}
