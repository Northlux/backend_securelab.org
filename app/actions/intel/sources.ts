'use server'

import { createServerSupabaseAnonClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser, requireAnalystOrAdmin } from '@/lib/auth/server-auth'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import { logUserAction } from '@/lib/utils/audit-logger'
import { sanitizeUrl } from '@/lib/utils/sanitize'
import { createRateLimitKey, getRateLimit, type RateLimitKey } from '@/lib/utils/rate-limits'

// Validation schemas
const SourceFormSchema = z.object({
  name: z.string().min(3).max(200),
  source_type: z.enum(['rss', 'api', 'web', 'database', 'manual']),
  url: z.string().url().nullable(),
  update_frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'manual']),
  priority: z.number().int().min(0).max(1000),
  is_active: z.boolean(),
})

type SourceFormData = z.infer<typeof SourceFormSchema>

/**
 * Get all sources
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 */
export async function getSources() {
  try {
    // Auth check
    await getCurrentUser()

    // Rate limiting
    const user = await getCurrentUser()
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SOURCE_LIST' as RateLimitKey),
      getRateLimit('SOURCE_LIST' as RateLimitKey).max,
      getRateLimit('SOURCE_LIST' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .order('priority', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('[getSources] Error:', error)
    throw error
  }
}

/**
 * Create a new source
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 50/hour
 * ✅ Input validation: Zod schema
 */
export async function createSource(formData: SourceFormData) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    const validated = SourceFormSchema.parse(formData)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SOURCE_CREATE' as RateLimitKey),
      getRateLimit('SOURCE_CREATE' as RateLimitKey).max,
      getRateLimit('SOURCE_CREATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    // Sanitize URL if provided
    const sanitizedUrl = validated.url ? sanitizeUrl(validated.url) : null

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('sources')
      .insert({
        name: validated.name,
        source_type: validated.source_type,
        url: sanitizedUrl,
        update_frequency: validated.update_frequency,
        priority: validated.priority,
        is_active: validated.is_active,
      })
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'source_create', 'source', data?.id, {
      name: validated.name,
      type: validated.source_type,
    })

    revalidatePath('/admin/intel/sources')
    return data
  } catch (error) {
    console.error('[createSource] Error:', error)
    throw error
  }
}

/**
 * Update an existing source
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 100/hour
 * ✅ Input validation: Zod schema
 */
export async function updateSource(id: string, formData: SourceFormData) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    const validated = SourceFormSchema.parse(formData)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SOURCE_UPDATE' as RateLimitKey),
      getRateLimit('SOURCE_UPDATE' as RateLimitKey).max,
      getRateLimit('SOURCE_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    // Sanitize URL if provided
    const sanitizedUrl = validated.url ? sanitizeUrl(validated.url) : null

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('sources')
      .update({
        name: validated.name,
        source_type: validated.source_type,
        url: sanitizedUrl,
        update_frequency: validated.update_frequency,
        priority: validated.priority,
        is_active: validated.is_active,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'source_update', 'source', id, {
      name: validated.name,
      type: validated.source_type,
    })

    revalidatePath('/admin/intel/sources')
    return data
  } catch (error) {
    console.error('[updateSource] Error:', error)
    throw error
  }
}

/**
 * Delete a source
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 20/hour
 */
export async function deleteSource(id: string) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SOURCE_DELETE' as RateLimitKey),
      getRateLimit('SOURCE_DELETE' as RateLimitKey).max,
      getRateLimit('SOURCE_DELETE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase.from('sources').delete().eq('id', id)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'source_delete', 'source', id)

    revalidatePath('/admin/intel/sources')
  } catch (error) {
    console.error('[deleteSource] Error:', error)
    throw error
  }
}

/**
 * Toggle source active/inactive status
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 100/hour
 */
export async function toggleSourceStatus(id: string, isActive: boolean) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'SOURCE_UPDATE' as RateLimitKey),
      getRateLimit('SOURCE_UPDATE' as RateLimitKey).max,
      getRateLimit('SOURCE_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase
      .from('sources')
      .update({ is_active: !isActive })
      .eq('id', id)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'source_toggle', 'source', id, {
      active: !isActive,
    })

    revalidatePath('/admin/intel/sources')
  } catch (error) {
    console.error('[toggleSourceStatus] Error:', error)
    throw error
  }
}
