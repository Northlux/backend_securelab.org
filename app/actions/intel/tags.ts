'use server'

import { createServerSupabaseAnonClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser, requireAnalystOrAdmin } from '@/lib/auth/server-auth'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import { logUserAction } from '@/lib/utils/audit-logger'
import { createRateLimitKey, getRateLimit, type RateLimitKey } from '@/lib/utils/rate-limits'

// Validation schemas
const TagFormSchema = z.object({
  name: z.string().min(2).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
})

const UuidSchema = z.string().uuid()

type TagFormData = z.infer<typeof TagFormSchema>

/**
 * Get all tags
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 */
export async function getTags() {
  try {
    // Auth check
    await getCurrentUser()

    // Rate limiting
    const user = await getCurrentUser()
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'TAG_LIST' as RateLimitKey),
      getRateLimit('TAG_LIST' as RateLimitKey).max,
      getRateLimit('TAG_LIST' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('[getTags] Error:', error)
    throw error
  }
}

/**
 * Create a new tag
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 100/hour
 * ✅ Input validation: Zod schema
 */
export async function createTag(formData: TagFormData) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    const validated = TagFormSchema.parse(formData)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'TAG_CREATE' as RateLimitKey),
      getRateLimit('TAG_CREATE' as RateLimitKey).max,
      getRateLimit('TAG_CREATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: validated.name,
        color: validated.color,
      })
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'tag_create', 'tag', data?.id, {
      name: validated.name,
    })

    revalidatePath('/admin/intel/tags')
    return data
  } catch (error) {
    console.error('[createTag] Error:', error)
    throw error
  }
}

/**
 * Update an existing tag
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 100/hour
 * ✅ Input validation: Zod schema
 */
export async function updateTag(id: string, formData: TagFormData) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    UuidSchema.parse(id)
    const validated = TagFormSchema.parse(formData)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'TAG_UPDATE' as RateLimitKey),
      getRateLimit('TAG_UPDATE' as RateLimitKey).max,
      getRateLimit('TAG_UPDATE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('tags')
      .update({
        name: validated.name,
        color: validated.color,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'tag_update', 'tag', id, {
      name: validated.name,
    })

    revalidatePath('/admin/intel/tags')
    return data
  } catch (error) {
    console.error('[updateTag] Error:', error)
    throw error
  }
}

/**
 * Delete a tag
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 50/hour
 */
export async function deleteTag(id: string) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    UuidSchema.parse(id)

    // Rate limiting
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'TAG_DELETE' as RateLimitKey),
      getRateLimit('TAG_DELETE' as RateLimitKey).max,
      getRateLimit('TAG_DELETE' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { error } = await supabase.from('tags').delete().eq('id', id)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'tag_delete', 'tag', id)

    revalidatePath('/admin/intel/tags')
  } catch (error) {
    console.error('[deleteTag] Error:', error)
    throw error
  }
}

/**
 * Add a tag to a signal
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 200/hour
 */
export async function addTagToSignal(signalId: string, tagId: string) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    UuidSchema.parse(signalId)
    UuidSchema.parse(tagId)

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
      .from('signal_tags')
      .insert({ signal_id: signalId, tag_id: tagId })

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'signal_tag_add', 'signal', signalId, {
      tag_id: tagId,
    })

    revalidatePath('/admin/intel/signals')
  } catch (error) {
    console.error('[addTagToSignal] Error:', error)
    throw error
  }
}

/**
 * Remove a tag from a signal
 * ✅ Auth check: Analyst or Admin
 * ✅ Rate limiting: 200/hour
 */
export async function removeTagFromSignal(signalId: string, tagId: string) {
  try {
    // Auth check
    const user = await requireAnalystOrAdmin()

    // Input validation
    UuidSchema.parse(signalId)
    UuidSchema.parse(tagId)

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
      .from('signal_tags')
      .delete()
      .eq('signal_id', signalId)
      .eq('tag_id', tagId)

    if (error) throw error

    // Audit log
    await logUserAction(user.userId, 'signal_tag_remove', 'signal', signalId, {
      tag_id: tagId,
    })

    revalidatePath('/admin/intel/signals')
  } catch (error) {
    console.error('[removeTagFromSignal] Error:', error)
    throw error
  }
}

/**
 * Get all tags for a signal
 * ✅ Auth check: Any authenticated user
 * ✅ Rate limiting: 1000/hour (read operation)
 */
export async function getSignalTags(signalId: string) {
  try {
    // Auth check
    await getCurrentUser()

    // Input validation
    UuidSchema.parse(signalId)

    // Rate limiting
    const user = await getCurrentUser()
    const rateLimit = checkRateLimit(
      createRateLimitKey(user.userId, 'TAG_LIST' as RateLimitKey),
      getRateLimit('TAG_LIST' as RateLimitKey).max,
      getRateLimit('TAG_LIST' as RateLimitKey).window
    )

    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
      )
    }

    const supabase = await createServerSupabaseAnonClient()
    const { data, error } = await supabase
      .from('signal_tags')
      .select('tag_id, tags(id, name, color)')
      .eq('signal_id', signalId)

    if (error) throw error
    return data
  } catch (error) {
    console.error('[getSignalTags] Error:', error)
    throw error
  }
}
