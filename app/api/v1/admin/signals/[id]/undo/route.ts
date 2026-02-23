import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const signalId = params.id

    // Get the current triage result
    const { data: currentTriage, error: fetchError } = await supabase
      .from('triage_results')
      .select('*')
      .eq('signal_id', signalId)
      .single()

    if (fetchError || !currentTriage) {
      return NextResponse.json(
        { error: 'Triage result not found' },
        { status: 404 }
      )
    }

    // Revert to pending status
    const { error: updateError } = await supabase
      .from('triage_results')
      .update({
        triage_status: 'pending',
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('signal_id', signalId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to undo action' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Action undone successfully',
      previousStatus: currentTriage.triage_status,
    })
  } catch (error) {
    console.error('Undo error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
