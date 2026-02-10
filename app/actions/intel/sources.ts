'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface SourceFormData {
  name: string
  source_type: string
  url: string | null
  update_frequency: string
  priority: number
  is_active: boolean
}

export async function getSources() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .order('priority', { ascending: false })

  if (error) throw error
  return data
}

export async function createSource(formData: SourceFormData) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('sources')
    .insert({
      name: formData.name,
      source_type: formData.source_type,
      url: formData.url,
      update_frequency: formData.update_frequency,
      priority: formData.priority,
      is_active: formData.is_active,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/intel/sources')
  return data
}

export async function updateSource(id: string, formData: SourceFormData) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('sources')
    .update({
      name: formData.name,
      source_type: formData.source_type,
      url: formData.url,
      update_frequency: formData.update_frequency,
      priority: formData.priority,
      is_active: formData.is_active,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/intel/sources')
  return data
}

export async function deleteSource(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('sources').delete().eq('id', id)

  if (error) throw error
  revalidatePath('/admin/intel/sources')
}

export async function toggleSourceStatus(id: string, isActive: boolean) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('sources')
    .update({ is_active: !isActive })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/admin/intel/sources')
}
