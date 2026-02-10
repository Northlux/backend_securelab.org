'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getIngestionLogs(page: number = 1, pageSize: number = 20) {
  const supabase = await createServerSupabaseClient()
  const { data, error, count } = await supabase
    .from('ingestion_logs')
    .select('*', { count: 'exact' })
    .order('started_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) throw error
  return { data, count }
}

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
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('ingestion_logs')
    .insert({
      source_id: logData.source_id,
      status: logData.status,
      signals_found: logData.signals_found,
      signals_imported: logData.signals_imported,
      signals_skipped: logData.signals_skipped,
      signals_errored: logData.signals_errored,
      error_message: logData.error_message || null,
      import_metadata: logData.import_metadata || {},
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/intel/logs')
  return data
}

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
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('ingestion_logs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/intel/logs')
  return data
}

export async function deleteIngestionLog(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('ingestion_logs').delete().eq('id', id)

  if (error) throw error
  revalidatePath('/admin/intel/logs')
}

export async function getLogsBySource(sourceId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('ingestion_logs')
    .select('*')
    .eq('source_id', sourceId)
    .order('started_at', { ascending: false })

  if (error) throw error
  return data
}
