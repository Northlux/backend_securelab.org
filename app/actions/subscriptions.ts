'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { serverLog, handleDatabaseError } from '@/lib/utils/logger'
import { logSubscriptionAction } from '@/lib/utils/audit-logger'

// Validation schemas
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
  const supabase = await createServerSupabaseClient()

  try {
    const from = (page - 1) * pageSize

    let query = supabase
      .from('subscriptions')
      .select('*, users(email), subscription_tiers(name)', { count: 'exact' })
      .range(from, from + pageSize - 1)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.tier_id) {
      query = query.eq('tier_id', filters.tier_id)
    }

    const { data, count, error } = await query

    if (error) {
      serverLog('error', 'getSubscriptions', 'Database query failed', { error: error.message })
      return { subscriptions: [], total: 0, page, pageSize }
    }

    const subscriptions = (data || []).map((sub: any) => ({
      ...sub,
      user_email: sub.users?.email,
      tier_name: sub.subscription_tiers?.name,
    })) as Subscription[]

    return {
      subscriptions,
      total: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    serverLog('error', 'getSubscriptions', 'Failed to fetch subscriptions', { error })
    return { subscriptions: [], total: 0, page, pageSize }
  }
}

/**
 * Get single subscription by ID
 */
export async function getSubscriptionById(subscriptionId: string): Promise<Subscription | null> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, users(email, user_metadata), subscription_tiers(name, price_monthly, price_annual, features)')
      .eq('id', subscriptionId)
      .single()

    if (error) {
      serverLog('warn', 'getSubscriptionById', `Subscription not found: ${subscriptionId}`)
      return null
    }

    return {
      ...data,
      user_email: data.users?.email,
      tier_name: data.subscription_tiers?.name,
    } as Subscription
  } catch (error) {
    handleDatabaseError('getSubscriptionById', error, 'fetch')
    return null
  }
}

/**
 * Get all subscription tiers
 */
export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select(`
        *,
        subscriptions(count)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      serverLog('error', 'getSubscriptionTiers', 'Database query failed', { error: error.message })
      return []
    }

    return (data || []).map((tier: any) => ({
      ...tier,
      user_count: tier.subscriptions?.length || 0,
    })) as SubscriptionTier[]
  } catch (error) {
    serverLog('error', 'getSubscriptionTiers', 'Failed to fetch tiers', { error })
    return []
  }
}

/**
 * Create new subscription tier
 */
export async function createSubscriptionTier(
  data: z.infer<typeof CreateTierSchema>
): Promise<{ success: boolean; tier?: SubscriptionTier; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    const validated = CreateTierSchema.parse(data)

    const { data: tier, error } = await supabase
      .from('subscription_tiers')
      .insert([validated])
      .select()
      .single()

    if (error) {
      serverLog('error', 'createSubscriptionTier', 'Tier creation failed', { error: error.message })
      return { success: false, error: 'Failed to create tier' }
    }

    revalidatePath('/admin/subscriptions/tiers')
    return { success: true, tier: tier as SubscriptionTier }
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Invalid data provided' : 'Failed to create tier'
    serverLog('error', 'createSubscriptionTier', message, { error })
    return { success: false, error: message }
  }
}

/**
 * Update subscription tier
 */
export async function updateSubscriptionTier(
  tierId: string,
  data: z.infer<typeof UpdateTierSchema>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    const validated = UpdateTierSchema.parse(data)

    const { error } = await supabase
      .from('subscription_tiers')
      .update(validated)
      .eq('id', tierId)

    if (error) {
      serverLog('error', 'updateSubscriptionTier', `Tier update failed for ${tierId}`, { error: error.message })
      return { success: false, error: 'Failed to update tier' }
    }

    revalidatePath('/admin/subscriptions/tiers')
    return { success: true }
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Invalid data provided' : 'Failed to update tier'
    serverLog('error', 'updateSubscriptionTier', message, { error })
    return { success: false, error: message }
  }
}

/**
 * Delete subscription tier
 */
export async function deleteSubscriptionTier(tierId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    // Soft delete by setting is_active = false
    const { error } = await supabase
      .from('subscription_tiers')
      .update({ is_active: false })
      .eq('id', tierId)

    if (error) {
      serverLog('error', 'deleteSubscriptionTier', `Tier deletion failed for ${tierId}`, { error: error.message })
      return { success: false, error: 'Failed to delete tier' }
    }

    // Log audit trail
    await logSubscriptionAction(tierId, 'subscription_upgrade_reject', 'Tier deleted')

    revalidatePath('/admin/subscriptions/tiers')
    return { success: true }
  } catch (error) {
    serverLog('error', 'deleteSubscriptionTier', 'Unexpected error deleting tier', { error })
    return { success: false, error: 'Failed to delete tier' }
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  data: z.infer<typeof CancelSubscriptionSchema>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    const validated = CancelSubscriptionSchema.parse(data)

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        cancellation_reason: validated.reason,
      })
      .eq('id', subscriptionId)

    if (error) {
      serverLog('error', 'cancelSubscription', `Subscription cancellation failed for ${subscriptionId}`, { error: error.message })
      return { success: false, error: 'Failed to cancel subscription' }
    }

    // Log audit trail
    await logSubscriptionAction(subscriptionId, 'subscription_cancel', validated.reason)

    revalidatePath('/admin/subscriptions')
    return { success: true }
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Invalid data provided' : 'Failed to cancel subscription'
    serverLog('error', 'cancelSubscription', message, { error })
    return { success: false, error: message }
  }
}

/**
 * Process refund for subscription
 */
export async function refundSubscription(
  subscriptionId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    // Record refund in billing history
    const { error } = await supabase
      .from('billing_history')
      .insert([
        {
          subscription_id: subscriptionId,
          type: 'refund',
          amount: -Math.abs(amount), // Negative for refund
          status: 'completed',
          notes: reason,
          created_at: new Date().toISOString(),
        },
      ])

    if (error) {
      serverLog('error', 'refundSubscription', `Refund processing failed for subscription ${subscriptionId}`, { error: error.message })
      return { success: false, error: 'Failed to process refund' }
    }

    // Log audit trail
    await logSubscriptionAction(subscriptionId, 'subscription_refund', reason, { amount })

    revalidatePath('/admin/subscriptions')
    return { success: true }
  } catch (error) {
    serverLog('error', 'refundSubscription', 'Unexpected error processing refund', { error })
    return { success: false, error: 'Failed to process refund' }
  }
}

/**
 * Get upgrade requests
 */
export async function getUpgradeRequests(
  page = 1,
  pageSize = 20,
  filters?: {
    status?: string
  }
): Promise<SubscriptionListResponse> {
  const supabase = await createServerSupabaseClient()

  try {
    const from = (page - 1) * pageSize

    let query = supabase
      .from('upgrade_requests')
      .select('*, users(email), from_tier:subscription_tiers!from_tier_id(name), to_tier:subscription_tiers!to_tier_id(name)', {
        count: 'exact',
      })
      .range(from, from + pageSize - 1)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, count, error } = await query

    if (error) {
      serverLog('error', 'getUpgradeRequests', 'Database query failed', { error: error.message })
      return { subscriptions: [], total: 0, page, pageSize }
    }

    return {
      subscriptions: (data || []) as any,
      total: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    serverLog('error', 'getUpgradeRequests', 'Failed to fetch upgrade requests', { error })
    return { subscriptions: [], total: 0, page, pageSize }
  }
}

/**
 * Approve upgrade request
 */
export async function approveUpgradeRequest(
  requestId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    const { error } = await supabase
      .from('upgrade_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        admin_notes: notes,
      })
      .eq('id', requestId)

    if (error) {
      serverLog('error', 'approveUpgradeRequest', `Upgrade approval failed for request ${requestId}`, { error: error.message })
      return { success: false, error: 'Failed to approve request' }
    }

    // Log audit trail
    await logSubscriptionAction(requestId, 'subscription_upgrade_approve', notes)

    revalidatePath('/admin/subscriptions/requests')
    return { success: true }
  } catch (error) {
    serverLog('error', 'approveUpgradeRequest', 'Unexpected error approving request', { error })
    return { success: false, error: 'Failed to approve request' }
  }
}

/**
 * Reject upgrade request
 */
export async function rejectUpgradeRequest(
  requestId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  try {
    const { error } = await supabase
      .from('upgrade_requests')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', requestId)

    if (error) {
      serverLog('error', 'rejectUpgradeRequest', `Upgrade rejection failed for request ${requestId}`, { error: error.message })
      return { success: false, error: 'Failed to reject request' }
    }

    // Log audit trail
    await logSubscriptionAction(requestId, 'subscription_upgrade_reject', reason)

    revalidatePath('/admin/subscriptions/requests')
    return { success: true }
  } catch (error) {
    serverLog('error', 'rejectUpgradeRequest', 'Unexpected error rejecting request', { error })
    return { success: false, error: 'Failed to reject request' }
  }
}

/**
 * Get billing history
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
  const supabase = await createServerSupabaseClient()

  try {
    const from = (page - 1) * pageSize

    let query = supabase
      .from('billing_history')
      .select('*, subscriptions(users(email))', { count: 'exact' })
      .range(from, from + pageSize - 1)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    const { data, count, error } = await query

    if (error) {
      serverLog('error', 'getBillingHistory', 'Database query failed', { error: error.message })
      return { subscriptions: [], total: 0, page, pageSize }
    }

    return {
      subscriptions: (data || []) as any,
      total: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    serverLog('error', 'getBillingHistory', 'Failed to fetch billing history', { error })
    return { subscriptions: [], total: 0, page, pageSize }
  }
}
