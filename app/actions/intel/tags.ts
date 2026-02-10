'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface TagFormData {
  name: string
  color: string
}

export async function getTags() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function createTag(formData: TagFormData) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('tags')
    .insert({
      name: formData.name,
      color: formData.color,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/intel/tags')
  return data
}

export async function updateTag(id: string, formData: TagFormData) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('tags')
    .update({
      name: formData.name,
      color: formData.color,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/intel/tags')
  return data
}

export async function deleteTag(id: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('tags').delete().eq('id', id)

  if (error) throw error
  revalidatePath('/admin/intel/tags')
}

export async function addTagToSignal(signalId: string, tagId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('signal_tags')
    .insert({ signal_id: signalId, tag_id: tagId })

  if (error) throw error
  revalidatePath('/admin/intel/signals')
}

export async function removeTagFromSignal(signalId: string, tagId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('signal_tags')
    .delete()
    .eq('signal_id', signalId)
    .eq('tag_id', tagId)

  if (error) throw error
  revalidatePath('/admin/intel/signals')
}

export async function getSignalTags(signalId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('signal_tags')
    .select('tag_id, tags(id, name, color)')
    .eq('signal_id', signalId)

  if (error) throw error
  return data
}
