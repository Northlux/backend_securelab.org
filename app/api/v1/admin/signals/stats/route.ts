import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  // Total signals
  const { count: totalSignals } = await supabase
    .from('signals')
    .select('*', { count: 'exact', head: true })

  // Triage status counts
  const { data: triageData } = await supabase
    .from('triage_results')
    .select('triage_status')

  const statusCounts: Record<string, number> = {
    approved: 0,
    rejected: 0,
    review: 0,
  }
  if (triageData) {
    for (const row of triageData) {
      const s = row.triage_status
      statusCounts[s] = (statusCounts[s] || 0) + 1
    }
  }

  // Pending = total - triaged
  const totalTriaged = Object.values(statusCounts).reduce((a, b) => a + b, 0)
  statusCounts.pending = (totalSignals || 0) - totalTriaged

  // Category counts
  const { data: catData } = await supabase
    .from('signals')
    .select('signal_category')

  const categoryCounts: Record<string, number> = {}
  if (catData) {
    for (const row of catData) {
      const c = row.signal_category
      categoryCounts[c] = (categoryCounts[c] || 0) + 1
    }
  }

  // Severity counts
  const { data: sevData } = await supabase
    .from('signals')
    .select('severity')

  const severityCounts: Record<string, number> = {}
  if (sevData) {
    for (const row of sevData) {
      const s = row.severity
      severityCounts[s] = (severityCounts[s] || 0) + 1
    }
  }

  return NextResponse.json({
    total: totalSignals || 0,
    byStatus: statusCounts,
    byCategory: categoryCounts,
    bySeverity: severityCounts,
  })
}
