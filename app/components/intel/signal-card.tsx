'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Star,
  Clock,
  Shield,
} from 'lucide-react'

interface TriageResult {
  id: string
  kimi_score: number | null
  openai_score: number | null
  triage_status: string
  processed_summary: string | null
  polished_content: string | null
}

interface Signal {
  id: string
  title: string
  summary: string | null
  signal_category: string
  severity: string
  source_url: string | null
  source_date: string | null
  created_at: string
  is_featured: boolean
  is_verified: boolean
  triage_results: TriageResult[] | TriageResult | null
}

const CATEGORY_COLORS: Record<string, string> = {
  vulnerability: 'bg-red-500/15 text-red-400',
  breach: 'bg-orange-500/15 text-orange-400',
  malware: 'bg-purple-500/15 text-purple-400',
  exploit: 'bg-yellow-500/15 text-yellow-400',
  ransomware: 'bg-pink-500/15 text-pink-400',
  apt: 'bg-cyan-500/15 text-cyan-400',
  phishing: 'bg-green-500/15 text-green-400',
  news: 'bg-blue-500/15 text-blue-400',
  research: 'bg-violet-500/15 text-violet-400',
  supply_chain: 'bg-amber-500/15 text-amber-400',
  policy: 'bg-slate-500/15 text-slate-400',
  tool: 'bg-teal-500/15 text-teal-400',
  advisory: 'bg-indigo-500/15 text-indigo-400',
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/20',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  low: 'bg-green-500/15 text-green-400 border-green-500/20',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
}

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-500/15 text-green-400',
  rejected: 'bg-red-500/15 text-red-400',
  review: 'bg-yellow-500/15 text-yellow-400',
  pending: 'bg-slate-500/15 text-slate-400',
}

function getTriage(signal: Signal): TriageResult | null {
  const tr = signal.triage_results
  if (!tr) return null
  if (Array.isArray(tr)) return tr[0] || null
  return tr
}

function getStatus(signal: Signal): string {
  const tr = getTriage(signal)
  return tr?.triage_status || 'pending'
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ScoreBadge({ label, score }: { label: string; score: number | null }) {
  if (score === null || score === undefined || score < 0) return null
  const color =
    score >= 70
      ? 'text-green-400'
      : score >= 40
        ? 'text-yellow-400'
        : 'text-red-400'
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${color}`}>{score}</span>
    </span>
  )
}

export function SignalCard({
  signal,
  selected,
  onSelect,
  onAction,
}: {
  signal: Signal
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
  onAction: (id: string, action: string) => void
}) {
  const [acting, setActing] = useState(false)
  const triage = getTriage(signal)
  const status = getStatus(signal)

  const handleAction = async (action: string) => {
    setActing(true)
    await onAction(signal.id, action)
    setActing(false)
  }

  return (
    <div
      className={`group bg-slate-800/40 border rounded-lg p-5 transition-all duration-150 hover:bg-slate-800/60 ${
        selected ? 'border-brand-500/50 bg-brand-500/5' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div className="pt-0.5 flex-shrink-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(signal.id, e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500/30 cursor-pointer"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title + badges row */}
          <div className="flex items-start gap-3 mb-2">
            <Link
              href={`/admin/intel/${signal.id}`}
              className="text-sm font-semibold text-slate-100 hover:text-brand-400 transition-colors leading-tight flex-1 min-w-0"
            >
              {signal.title}
            </Link>
            {signal.is_featured && (
              <Star size={14} className="text-yellow-400 flex-shrink-0 fill-yellow-400" />
            )}
            {signal.is_verified && (
              <Shield size={14} className="text-green-400 flex-shrink-0" />
            )}
          </div>

          {/* Summary */}
          {signal.summary && (
            <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
              {signal.summary.slice(0, 200)}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category */}
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                CATEGORY_COLORS[signal.signal_category] || 'bg-slate-500/15 text-slate-400'
              }`}
            >
              {signal.signal_category}
            </span>

            {/* Severity */}
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium border ${
                SEVERITY_COLORS[signal.severity] || 'bg-slate-500/15 text-slate-400 border-slate-500/20'
              }`}
            >
              {signal.severity}
            </span>

            {/* Triage status */}
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                STATUS_COLORS[status] || 'bg-slate-500/15 text-slate-400'
              }`}
            >
              {status}
            </span>

            {/* AI Scores */}
            {triage && (
              <div className="flex items-center gap-2 ml-1">
                <ScoreBadge label="K" score={triage.kimi_score} />
                <ScoreBadge label="O" score={triage.openai_score} />
              </div>
            )}

            {/* Date */}
            <span className="flex items-center gap-1 text-xs text-slate-600 ml-auto">
              <Clock size={12} />
              {formatDate(signal.source_date || signal.created_at)}
            </span>

            {/* Source link */}
            {signal.source_url && (
              <a
                href={signal.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-brand-400 transition-colors"
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Quick actions — always visible on mobile, hover-reveal on desktop */}
        {(status === 'pending' || status === 'review') && (
          <div className="flex flex-col sm:flex-row items-center gap-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleAction('approve')}
              disabled={acting}
              className="p-2.5 sm:p-1.5 rounded-md text-green-500 hover:bg-green-500/10 active:bg-green-500/20 transition-all disabled:opacity-50 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              title="Approve"
            >
              <CheckCircle size={20} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={acting}
              className="p-2.5 sm:p-1.5 rounded-md text-red-500 hover:bg-red-500/10 active:bg-red-500/20 transition-all disabled:opacity-50 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              title="Reject"
            >
              <XCircle size={20} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
