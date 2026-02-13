'use server'

import { createServerSupabaseAnonClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser, requireAnalystOrAdmin } from '@/lib/auth/server-auth'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import { logUserAction } from '@/lib/utils/audit-logger'
import { sanitizeJson, isValidUuid } from '@/lib/utils/sanitize'
import { createRateLimitKey, getRateLimit, type RateLimitKey } from '@/lib/utils/rate-limits'

// Validation schemas
const IngestionLogDataSchema = z.object({
  source_id: z.string().uuid().nullable(),
  status: z.enum(['success', 'error', 'pending']),
  signals_found: z.number().int().min(0),
  signals_imported: z.number().int().min(0),
  signals_skipped: z.number().int().min(0),
  signals_errored: z.number().int().min(0),
  error_message: z.string().max(1000).nullable().optional(),
  import_metadata: z.record(z.any()).optional(),
})

const UpdateIngestionLogSchema = z.object({
  status: z.enum(['success', 'error', 'pending']).optional(),
  signals_imported: z.number().int().min(0).optional(),
  signals_skipped: z.number().int().min(0).optional(),
  signals_errored: z.number().int().min(0).optional(),
  error_message: z.string().max(1000).nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
})

const GetLogsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

/**
 * Get paginated ingestion logs
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 */
export async function getIngestionLogs(page: number = 1, pageSize: number = 20) {
  try {
    // Auth check
    await getCurrentUser()

    // Input validation
    const validated = GetLogsSchema.parse({ page, pageSize })

    // Rate limiting
    const user = await getCurrentUser()
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'INGESTION_LIST' as RateLimitKey),
      getRateLimit('INGESTION_LIST' as RateLimitKey).max,
      getRateLimit('INGESTION_LIST' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, error, count } = await supabase
      .from('ingestion_logs')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(
        (validated.page - 1) * validated.pageSize,
        validated.page * validated.pageSize - 1
      )

    if (error) throw error
    return { data, count }
  } catch (error) {
    console.error('[getIngestionLogs] Error:', error)
    throw error
  }
}

/**
 * Create a new ingestion log
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 100/hour
 * ✅ Input validation: Zod schema
 */
export async function createIngestionLog(logData: {
  source_id: string | null
  status: 'success' | 'error' | 'pending'
  signals_found: number
  signals_imported: number
  signals_skipped: number
  signals_errored: number
  error_message?: string | null
  import_metadata?: Record<string, unknown>
}) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    const validated = IngestionLogDataSchema.parse(logData)

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

    // Sanitize metadata
    const sanitizedMetadata = validated.import_metadata
      ? sanitizeJson(validated.import_metadata)
      : {}

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('ingestion_logs')
      .insert({
        source_id: validated.source_id,
        status: validated.status,
        signals_found: validated.signals_found,
        signals_imported: validated.signals_imported,
        signals_skipped: validated.signals_skipped,
        signals_errored: validated.signals_errored,
        error_message: validated.error_message || null,
        import_metadata: sanitizedMetadata,
      })
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'ingestion_log_create', 'log', data?.id, {
      source_id: validated.source_id,
      status: validated.status,
    })

    revalidatePath('/admin/intel/logs')
    return data
  } catch (error) {
    console.error('[createIngestionLog] Error:', error)
    throw error
  }
}

/**
 * Update an ingestion log
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 200/hour
 * ✅ Input validation: Zod schema
 */
export async function updateIngestionLog(
  id: string,
  updates: {
    status?: 'success' | 'error' | 'pending'
    signals_imported?: number
    signals_skipped?: number
    signals_errored?: number
    error_message?: string | null
    completed_at?: string | null
  }
) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    if (!isValidUuid(id)) {
      throw new Error('Invalid log ID format')
    }
    const validated = UpdateIngestionLogSchema.parse(updates)

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
      .from('ingestion_logs')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'ingestion_log_update', 'log', id, {
      status: validated.status,
    })

    revalidatePath('/admin/intel/logs')
    return data
  } catch (error) {
    console.error('[updateIngestionLog] Error:', error)
    throw error
  }
}

/**
 * Delete an ingestion log
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 50/hour
 */
export async function deleteIngestionLog(id: string) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    if (!isValidUuid(id)) {
      throw new Error('Invalid log ID format')
    }

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
    const { error } = await supabase.from('ingestion_logs').delete().eq('id', id)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'ingestion_log_delete', 'log', id)

    revalidatePath('/admin/intel/logs')
  } catch (error) {
    console.error('[deleteIngestionLog] Error:', error)
    throw error
  }
}

/**
 * Get logs by source ID
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 */
export async function getLogsBySource(sourceId: string) {
  try {
    // Auth check
    await getCurrentUser()

    // Input validation
    if (!isValidUuid(sourceId)) {
      throw new Error('Invalid source ID format')
    }

    // Rate limiting
    const user = await getCurrentUser()
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'INGESTION_LIST' as RateLimitKey),
      getRateLimit('INGESTION_LIST' as RateLimitKey).max,
      getRateLimit('INGESTION_LIST' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('ingestion_logs')
      .select('*')
      .eq('source_id', sourceId)
      .order('started_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('[getLogsBySource] Error:', error)
    throw error
  }
}
