'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface SignalFormData {
  title: string
  summary: string | null
  full_content: string | null
  signal_category: string
  severity: string
  confidence_level: number
  source_id: string | null
  source_url: string | null
  source_date: string | null
  cve_ids: string[]
  threat_actors: string[]
  target_industries: string[]
  target_regions: string[]
  affected_products: string[]
  is_verified: boolean
  is_featured: boolean
}

export async function getSignals(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    severity?: string
    category?: string
    search?: string
  }
) {
  const supabase = await createServerSupabaseClient()
  let query = supabase.from('signals').select('*', { count: 'exact' })

  if (filters?.severity) {
    query = query.eq('severity', filters.severity)
  }
  if (filters?.category) {
    query = query.eq('signal_category', filters.category)
  }
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`
    )
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) throw error
  return { data, count }
}

export async function createSignal(formData: SignalFormData) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('signals')
    .insert({
      title: formData.title,
      summary: formData.summary,
      full_content: formData.full_content,
      signal_category: formData.signal_category,
      severity: formData.severity,
      confidence_level: formData.confidence_level,
      source_id: formData.source_id,
      source_url: formData.source_url,
      source_date: formData.source_date,
      cve_ids: formData.cve_ids,
      threat_actors: formData.threat_actors,
      target_industries: formData.target_industries,
      target_regions: formData.target_regions,
      affected_products: formData.affected_products,
      is_verified: formData.is_verified,
      is_featured: formData.is_featured,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/intel/signals')
  return data
}

export async function updateSignal(id: string, formData: SignalFormData) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('signals')
    .update({
      title: formData.title,
      summary: formData.summary,
      full_content: formData.full_content,
      signal_category: formData.signal_category,
      severity: formData.severity,
      confidence_level: formData.confidence_level,
      source_id: formData.source_id,
      source_url: formData.source_url,
      source_date: formData.source_date,
      cve_ids: formData.cve_ids,
      threat_actors: formData.threat_actors,
      target_industries: formData.target_industries,
      target_regions: formData.target_regions,
      affected_products: formData.affected_products,
      is_verified: formData.is_verified,
      is_featured: formData.is_featured,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/intel/signals')
  return data
}

export async function deleteSignal(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('signals').delete().eq('id', id)

  if (error) throw error
  revalidatePath('/admin/intel/signals')
}

export async function toggleSignalVerification(id: string, isVerified: boolean) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('signals')
    .update({ is_verified: !isVerified })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/admin/intel/signals')
}

export async function toggleSignalFeatured(id: string, isFeatured: boolean) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('signals')
    .update({ is_featured: !isFeatured })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/admin/intel/signals')
}

export async function updateSignalSeverity(
  id: string,
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('signals')
    .update({ severity })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/admin/intel/signals')
}
