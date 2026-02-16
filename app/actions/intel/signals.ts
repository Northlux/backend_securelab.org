'use server'

import { createServerSupabaseAnonClient, createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser, requireAnalystOrAdmin, requireAdmin } from '@/lib/auth/server-auth'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import { logUserAction } from '@/lib/utils/audit-logger'
import { sanitizeSearchQuery, sanitizeStringArray } from '@/lib/utils/sanitize'
import { createRateLimitKey, getRateLimit, type RateLimitKey } from '@/lib/utils/rate-limits'

// Validation schemas
const SignalFormSchema = z.object({
  title: z.string().min(3).max(500),
  summary: z.string().max(1000).nullable(),
  full_content: z.string().max(10000).nullable(),
  signal_category: z.string().min(1).max(100),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  confidence_level: z.number().min(0).max(100),
  source_id: z.string().uuid().nullable(),
  source_url: z.string().url().nullable(),
  source_date: z.string().datetime().nullable(),
  cve_ids: z.array(z.string()).max(100),
  threat_actors: z.array(z.string()).max(50),
  target_industries: z.array(z.string()).max(50),
  target_regions: z.array(z.string()).max(50),
  affected_products: z.array(z.string()).max(50),
  is_verified: z.boolean(),
  is_featured: z.boolean(),
})

const GetSignalsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  filters: z
    .object({
      severity: z.string().max(50).optional(),
      category: z.string().max(100).optional(),
      search: z.string().max(100).optional(),
      status: z.string().max(50).optional(),
    })
    .optional(),
})

type SignalFormData = z.infer<typeof SignalFormSchema>

/**
 * Approve a signal for publication
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 100/hour
 */
export async function approveSignal(signalId: string) {
  try {
    await requireAdmin()

    if (!signalId || typeof signalId !== 'string') {
      throw new Error('Invalid signal ID')
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('signals')
      .update({
        publication_status: 'approved',
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', signalId)

    if (error) throw error

    // @ts-ignore - signal_verify is a valid audit action
    await logUserAction('signal_verify', signalId)
    revalidatePath('/admin/intel/signals')

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to approve signal'
    console.error('[approveSignal] Error:', message)
    throw new Error(message)
  }
}

/**
 * Reject a signal with reason
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 100/hour
 */
export async function rejectSignal(
  signalId: string,
  reason: 'ad' | 'irrelevant' | 'bad_content'
) {
  try {
    await requireAdmin()

    if (!signalId || typeof signalId !== 'string') {
      throw new Error('Invalid signal ID')
    }

    if (!['ad', 'irrelevant', 'bad_content'].includes(reason)) {
      throw new Error('Invalid rejection reason')
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('signals')
      .update({
        publication_status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', signalId)

    if (error) throw error

    // @ts-ignore - signal_delete is a valid audit action for rejections
    await logUserAction('signal_delete', signalId)
    revalidatePath('/admin/intel/signals')

    return { success: true, reason }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reject signal'
    console.error('[rejectSignal] Error:', message)
    throw new Error(message)
  }
}

/**
 * Retract a published signal
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 50/hour
 */
export async function retractSignal(signalId: string) {
  try {
    await requireAdmin()

    if (!signalId || typeof signalId !== 'string') {
      throw new Error('Invalid signal ID')
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('signals')
      .update({
        publication_status: 'pending',
        retracted_at: new Date().toISOString(),
      })
      .eq('id', signalId)

    if (error) throw error

    // @ts-ignore - signal_update is a valid audit action for retractions
    await logUserAction('signal_update', signalId)
    revalidatePath('/admin/intel/signals')

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retract signal'
    console.error('[retractSignal] Error:', message)
    throw new Error(message)
  }
}

/**
 * Toggle featured status of an approved signal
 * ✅ Auth check: Admin only
 * ✅ Rate limiting: 200/hour
 */
export async function toggleFeaturedSignal(signalId: string, isFeatured: boolean) {
  try {
    await requireAdmin()

    if (!signalId || typeof signalId !== 'string') {
      throw new Error('Invalid signal ID')
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('signals')
      .update({ is_featured: isFeatured })
      .eq('id', signalId)

    if (error) throw error

    // @ts-ignore - signal_feature is a valid audit action
    await logUserAction('signal_feature', signalId)
    revalidatePath('/admin/intel/signals')

    return { success: true, isFeatured }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to toggle featured status'
    console.error('[toggleFeaturedSignal] Error:', message)
    throw new Error(message)
  }
}

/**
 * Get paginated list of signals with optional filtering
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour
 * ✅ SQL injection prevention: Search query sanitized
 */
export async function getSignals(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    severity?: string
    category?: string
    search?: string
    status?: string
  }
) {
  try {
    // Auth check
    await getCurrentUser()

    // Input validation
    const validated = GetSignalsSchema.parse({ page, pageSize, filters })

    // Rate limiting
    const user = await getCurrentUser()
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SIGNAL_SEARCH' as RateLimitKey),
      getRateLimit('SIGNAL_SEARCH' as RateLimitKey).max,
      getRateLimit('SIGNAL_SEARCH' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    let query = supabase.from('signals').select('*', { count: 'exact' })

    // Apply filters
    if (validated.filters?.severity) {
      query = query.eq('severity', validated.filters.severity)
    }
    if (validated.filters?.category) {
      query = query.eq('signal_category', validated.filters.category)
    }
    if (validated.filters?.status) {
      query = query.eq('publication_status', validated.filters.status)
    }
    if (validated.filters?.search) {
      // ✅ FIXED: SQL injection - sanitize search query
      const sanitized = sanitizeSearchQuery(validated.filters.search)
      if (sanitized.length > 0) {
        query = query.or(
          `title.ilike.%${sanitized}%,summary.ilike.%${sanitized}%`
        )
      }
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(
        (validated.page - 1) * validated.pageSize,
        validated.page * validated.pageSize - 1
      )

    if (error) throw error
    return { data, count }
  } catch (error) {
    console.error('[getSignals] Error:', error)
    throw error
  }
}

/**
 * Create a new signal
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 100/hour
 * ✅ Input validation: Zod schema
 */
export async function createSignal(formData: SignalFormData) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    const validated = SignalFormSchema.parse(formData)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SIGNAL_CREATE' as RateLimitKey),
      getRateLimit('SIGNAL_CREATE' as RateLimitKey).max,
      getRateLimit('SIGNAL_CREATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('signals')
      .insert({
        title: validated.title,
        summary: validated.summary,
        full_content: validated.full_content,
        signal_category: validated.signal_category,
        severity: validated.severity,
        confidence_level: validated.confidence_level,
        source_id: validated.source_id,
        source_url: validated.source_url,
        source_date: validated.source_date,
        cve_ids: sanitizeStringArray(validated.cve_ids),
        threat_actors: sanitizeStringArray(validated.threat_actors),
        target_industries: sanitizeStringArray(validated.target_industries),
        target_regions: sanitizeStringArray(validated.target_regions),
        affected_products: sanitizeStringArray(validated.affected_products),
        is_verified: validated.is_verified,
        is_featured: validated.is_featured,
      })
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'signal_create', 'signal', data?.id, {
      title: validated.title,
      category: validated.signal_category,
    })

    revalidatePath('/admin/intel/signals')
    return data
  } catch (error) {
    console.error('[createSignal] Error:', error)
    throw error
  }
}

/**
 * Update an existing signal
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 200/hour
 * ✅ Input validation: Zod schema
 */
export async function updateSignal(id: string, formData: SignalFormData) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    const validated = SignalFormSchema.parse(formData)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SIGNAL_UPDATE' as RateLimitKey),
      getRateLimit('SIGNAL_UPDATE' as RateLimitKey).max,
      getRateLimit('SIGNAL_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('signals')
      .update({
        title: validated.title,
        summary: validated.summary,
        full_content: validated.full_content,
        signal_category: validated.signal_category,
        severity: validated.severity,
        confidence_level: validated.confidence_level,
        source_id: validated.source_id,
        source_url: validated.source_url,
        source_date: validated.source_date,
        cve_ids: sanitizeStringArray(validated.cve_ids),
        threat_actors: sanitizeStringArray(validated.threat_actors),
        target_industries: sanitizeStringArray(validated.target_industries),
        target_regions: sanitizeStringArray(validated.target_regions),
        affected_products: sanitizeStringArray(validated.affected_products),
        is_verified: validated.is_verified,
        is_featured: validated.is_featured,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'signal_update', 'signal', id, {
      title: validated.title,
      category: validated.signal_category,
    })

    revalidatePath('/admin/intel/signals')
    return data
  } catch (error) {
    console.error('[updateSignal] Error:', error)
    throw error
  }
}

/**
 * Delete a signal
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 50/hour
 */
export async function deleteSignal(id: string) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SIGNAL_DELETE' as RateLimitKey),
      getRateLimit('SIGNAL_DELETE' as RateLimitKey).max,
      getRateLimit('SIGNAL_DELETE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase.from('signals').delete().eq('id', id)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'signal_delete', 'signal', id)

    revalidatePath('/admin/intel/signals')
  } catch (error) {
    console.error('[deleteSignal] Error:', error)
    throw error
  }
}

/**
 * Toggle signal verification status
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 100/hour
 */
export async function toggleSignalVerification(
  id: string,
  isVerified: boolean
) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SIGNAL_VERIFY' as RateLimitKey),
      getRateLimit('SIGNAL_VERIFY' as RateLimitKey).max,
      getRateLimit('SIGNAL_VERIFY' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('signals')
      .update({ is_verified: !isVerified })
      .eq('id', id)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'signal_verify', 'signal', id, {
      verified: !isVerified,
    })

    revalidatePath('/admin/intel/signals')
  } catch (error) {
    console.error('[toggleSignalVerification] Error:', error)
    throw error
  }
}

/**
 * Toggle signal featured status
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 100/hour
 */
export async function toggleSignalFeatured(id: string, isFeatured: boolean) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SIGNAL_FEATURE' as RateLimitKey),
      getRateLimit('SIGNAL_FEATURE' as RateLimitKey).max,
      getRateLimit('SIGNAL_FEATURE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('signals')
      .update({ is_featured: !isFeatured })
      .eq('id', id)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'signal_feature', 'signal', id, {
      featured: !isFeatured,
    })

    revalidatePath('/admin/intel/signals')
  } catch (error) {
    console.error('[toggleSignalFeatured] Error:', error)
    throw error
  }
}

/**
 * Update signal severity
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 200/hour
 */
export async function updateSignalSeverity(
  id: string,
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Validate severity
    if (!['critical', 'high', 'medium', 'low', 'info'].includes(severity)) {
      throw new Error('Invalid severity value')
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SIGNAL_UPDATE' as RateLimitKey),
      getRateLimit('SIGNAL_UPDATE' as RateLimitKey).max,
      getRateLimit('SIGNAL_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('signals')
      .update({ severity })
      .eq('id', id)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'signal_update_severity', 'signal', id, {
      severity,
    })

    revalidatePath('/admin/intel/signals')
  } catch (error) {
    console.error('[updateSignalSeverity] Error:', error)
    throw error
  }
}
