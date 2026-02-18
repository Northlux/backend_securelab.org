import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('signals')
    .select(`
      *,
      triage_results (
        id,
        kimi_score,
        kimi_reason,
        openai_score,
        openai_reason,
        triage_status,
        processed_summary,
        polished_content,
        created_at,
        updated_at
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const body = await request.json()

  const results: Record<string, unknown> = {}

  // Update signal fields
  const signalUpdates: Record<string, unknown> = {}
  if (body.is_featured !== undefined) signalUpdates.is_featured = body.is_featured
  if (body.is_verified !== undefined) signalUpdates.is_verified = body.is_verified

  if (Object.keys(signalUpdates).length > 0) {
    signalUpdates.updated_at = new Date().toISOString()
    const { error } = await supabase
      .from('signals')
      .update(signalUpdates)
      .eq('id', id)

    if (error) {
      console.error('[PATCH signals] update signal error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    results.signal = 'updated'
  }

  // Update triage status
  if (body.triage_status) {
    // Check if triage result exists
    const { data: existing } = await supabase
      .from('triage_results')
      .select('id')
      .eq('signal_id', id)
      .single()

    if (existing) {
      const triageUpdate: Record<string, unknown> = {
        triage_status: body.triage_status,
        updated_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin',
      }
      if (body.rejection_reason) {
        triageUpdate.rejection_reason = body.rejection_reason
      }
      const { error } = await supabase
        .from('triage_results')
        .update(triageUpdate)
        .eq('signal_id', id)

      if (error) {
        console.error('[PATCH signals] update triage error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Create a triage result with manual status
      const insertData: Record<string, unknown> = {
        signal_id: id,
        triage_status: body.triage_status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin',
      }
      if (body.rejection_reason) {
        insertData.rejection_reason = body.rejection_reason
      }
      const { error } = await supabase
        .from('triage_results')
        .insert(insertData)

      if (error) {
        console.error('[PATCH signals] insert triage error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
    results.triage = body.triage_status
  }

  return NextResponse.json({ success: true, results })
}
