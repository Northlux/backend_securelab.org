import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const body = await request.json()

  const { action, ids } = body as { action: string; ids: string[] }

  if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'action and ids[] required' },
      { status: 400 }
    )
  }

  if (!['approve', 'reject', 'review', 'feature', 'unfeature', 'verify'].includes(action)) {
    return NextResponse.json(
      { error: `Invalid action: ${action}` },
      { status: 400 }
    )
  }

  let updated = 0
  const errors: string[] = []

  if (action === 'approve' || action === 'reject' || action === 'review') {
    const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'review'
    const rejectionReason = body.rejection_reason || null

    for (const id of ids) {
      // Check if triage result exists
      const { data: existing } = await supabase
        .from('triage_results')
        .select('id')
        .eq('signal_id', id)
        .single()

      const triageData: Record<string, unknown> = {
        triage_status: status,
        updated_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin',
      }
      if (rejectionReason) triageData.rejection_reason = rejectionReason

      if (existing) {
        const { error } = await supabase
          .from('triage_results')
          .update(triageData)
          .eq('signal_id', id)
        if (error) errors.push(`${id}: ${error.message}`)
        else updated++
      } else {
        triageData.signal_id = id
        const { error } = await supabase
          .from('triage_results')
          .insert(triageData)
        if (error) errors.push(`${id}: ${error.message}`)
        else updated++
      }
    }
  }

  if (action === 'feature' || action === 'unfeature') {
    const { error } = await supabase
      .from('signals')
      .update({
        is_featured: action === 'feature',
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)

    if (error) {
      errors.push(error.message)
    } else {
      updated = ids.length
    }
  }

  if (action === 'verify') {
    const { error } = await supabase
      .from('signals')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)

    if (error) {
      errors.push(error.message)
    } else {
      updated = ids.length
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    updated,
    errors: errors.length > 0 ? errors : undefined,
  })
}
