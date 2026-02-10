'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function bulkDeleteSignals(ids: string[]) {
  if (!ids.length) throw new Error('No signal IDs provided')

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('signals').delete().in('id', ids)

  if (error) throw error
  revalidatePath('/admin/intel/signals')
  return { deleted: ids.length }
}

export async function bulkUpdateSeverity(
  ids: string[],
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
) {
  if (!ids.length) throw new Error('No signal IDs provided')

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('signals')
    .update({ severity })
    .in('id', ids)

  if (error) throw error
  revalidatePath('/admin/intel/signals')
  return { updated: ids.length }
}

export async function bulkAddTags(signalIds: string[], tagIds: string[]) {
  if (!signalIds.length || !tagIds.length) {
    throw new Error('Signal IDs and tag IDs are required')
  }

  const supabase = await createServerSupabaseClient()
  const insertData = signalIds.flatMap((signalId) =>
    tagIds.map((tagId) => ({ signal_id: signalId, tag_id: tagId }))
  )

  const { error } = await supabase.from('signal_tags').insert(insertData, {
    onConflict: 'signal_id,tag_id',
  })

  if (error) throw error
  revalidatePath('/admin/intel/signals')
  return { added: insertData.length }
}

export async function bulkRemoveTags(signalIds: string[], tagIds: string[]) {
  if (!signalIds.length || !tagIds.length) {
    throw new Error('Signal IDs and tag IDs are required')
  }

  const supabase = await createServerSupabaseClient()

  let query = supabase.from('signal_tags').delete()
  query = query.in('signal_id', signalIds)
  query = query.in('tag_id', tagIds)

  const { error } = await query

  if (error) throw error
  revalidatePath('/admin/intel/signals')
  return { removed: signalIds.length * tagIds.length }
}

export async function bulkMarkAsVerified(ids: string[]) {
  if (!ids.length) throw new Error('No signal IDs provided')

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('signals')
    .update({ is_verified: true })
    .in('id', ids)

  if (error) throw error
  revalidatePath('/admin/intel/signals')
  return { updated: ids.length }
}

export async function bulkUnmarkAsVerified(ids: string[]) {
  if (!ids.length) throw new Error('No signal IDs provided')

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('signals')
    .update({ is_verified: false })
    .in('id', ids)

  if (error) throw error
  revalidatePath('/admin/intel/signals')
  return { updated: ids.length }
}
