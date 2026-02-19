'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Star,
  Shield,
  ExternalLink,
  Clock,
  Brain,
  FileText,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface TriageResult {
  id: string
  kimi_score: number | null
  kimi_reason: string | null
  openai_score: number | null
  openai_reason: string | null
  triage_status: string
  processed_summary: string | null
  polished_content: string | null
  created_at: string
  updated_at: string
}

interface Signal {
  id: string
  title: string
  summary: string | null
  full_content: string | null
  signal_category: string
  severity: string
  confidence_level: number | null
  source_url: string | null
  source_date: string | null
  cve_ids: string[]
  threat_actors: string[]
  target_industries: string[]
  target_regions: string[]
  affected_products: string[]
  is_featured: boolean
  is_verified: boolean
  image_url: string | null
  post_source: string | null
  created_at: string
  triage_results: TriageResult[] | TriageResult | null
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/15 text-green-400 border-green-500/30',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-green-500/15 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  review: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  pending: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

function getTriage(signal: Signal): TriageResult | null {
  const tr = signal.triage_results
  if (!tr) return null
  if (Array.isArray(tr)) return tr[0] || null
  return tr
}

function ScoreBar({ label, score, reason }: { label: string; score: number | null; reason: string | null }) {
  if (score === null || score === undefined || score < 0) {
    return (
      <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg border border-slate-800/50">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-xs text-slate-600">Not scored</span>
      </div>
    )
  }

  const pct = Math.min(Math.max(score, 0), 100)
  const barColor =
    score >= 70
      ? 'bg-green-500'
      : score >= 40
        ? 'bg-yellow-500'
        : 'bg-red-500'

  return (
    <div className="p-4 bg-slate-900/40 rounded-lg border border-slate-800/50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-lg font-semibold text-slate-100">{score}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {reason && (
        <p className="text-xs text-slate-500 leading-relaxed">{reason}</p>
      )}
    </div>
  )
}

function TagList({ label, items, linkPrefix }: { label: string; items: string[]; linkPrefix?: string }) {
  if (!items || items.length === 0) return null
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) =>
          linkPrefix ? (
            <a
              key={i}
              href={`${linkPrefix}${item}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 text-xs bg-slate-800 text-brand-400 hover:text-brand-300 rounded border border-slate-700/50 transition-colors"
            >
              {item} ↗
            </a>
          ) : (
            <span
              key={i}
              className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded border border-slate-700/50"
            >
              {item}
            </span>
          )
        )}
      </div>
    </div>
  )
}

function getImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''
  return r2Base ? `${r2Base.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url
}

function parseSummaryJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

export default function SignalDetailPage() {
  const params = useParams()
  const [signal, setSignal] = useState<Signal | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const signalId = params.id as string

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/admin/signals/${signalId}`)
        const json = await res.json()
        setSignal(json.data)
      } catch {
        toast.error( 'Failed to load signal')
      }
      setLoading(false)
    }
    load()
  }, [signalId])

  const handleAction = async (action: string) => {
    if (!signal) return
    setActing(true)
    try {
      const body: Record<string, unknown> = {}
      if (action === 'approve' || action === 'reject') {
        body.triage_status = action === 'approve' ? 'approved' : 'rejected'
      } else if (action === 'feature') {
        body.is_featured = !signal.is_featured
      } else if (action === 'verify') {
        body.is_verified = !signal.is_verified
      }

      const res = await fetch(`/api/v1/admin/signals/${signal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success( `Signal ${action}d`)
        // Reload
        const reload = await fetch(`/api/v1/admin/signals/${signalId}`)
        const json = await reload.json()
        setSignal(json.data)
      } else {
        toast.error( `Failed to ${action}`)
      }
    } catch {
      toast.error( 'Network error')
    }
    setActing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={20} className="text-slate-600 animate-spin" />
      </div>
    )
  }

  if (!signal) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={32} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-500">Signal not found</p>
        <Link href="/admin/intel" className="text-brand-400 text-sm mt-2 inline-block hover:text-brand-300">
          Back to queue
        </Link>
      </div>
    )
  }

  const triage = getTriage(signal)
  const status = triage?.triage_status || 'pending'
  const summaryData = parseSummaryJson(triage?.processed_summary || null)

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back + actions bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/intel"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to queue
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction('approve')}
            disabled={acting || status === 'approved'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20 transition-all disabled:opacity-30"
          >
            <CheckCircle size={16} />
            Approve
          </button>
          <button
            onClick={() => handleAction('reject')}
            disabled={acting || status === 'rejected'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 transition-all disabled:opacity-30"
          >
            <XCircle size={16} />
            Reject
          </button>
          <button
            onClick={() => handleAction('feature')}
            disabled={acting}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              signal.is_featured
                ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
                : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800'
            }`}
          >
            <Star size={16} className={signal.is_featured ? 'fill-yellow-400' : ''} />
            {signal.is_featured ? 'Featured' : 'Feature'}
          </button>
          <button
            onClick={() => handleAction('verify')}
            disabled={acting}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              signal.is_verified
                ? 'bg-green-500/15 text-green-400 border-green-500/20'
                : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800'
            }`}
          >
            <Shield size={16} />
            {signal.is_verified ? 'Verified' : 'Verify'}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-semibold text-slate-100 leading-tight">{signal.title}</h1>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-1 rounded text-xs font-medium border ${SEVERITY_STYLES[signal.severity] || ''}`}>
            {signal.severity}
          </span>
          <span className="px-2.5 py-1 rounded text-xs font-medium bg-slate-700/50 text-slate-300">
            {signal.signal_category}
          </span>
          <span className={`px-2.5 py-1 rounded text-xs font-medium border ${STATUS_STYLES[status] || ''}`}>
            {status}
          </span>
          {signal.post_source && (
            <span className="px-2.5 py-1 rounded text-xs font-medium bg-slate-700/30 text-slate-500">
              via {signal.post_source}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-slate-600 ml-auto">
            <Clock size={12} />
            {signal.source_date
              ? new Date(signal.source_date).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })
              : new Date(signal.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
          </span>
        </div>

        {signal.source_url && (
          <a
            href={signal.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            <ExternalLink size={14} />
            {signal.source_url.length > 80 ? signal.source_url.slice(0, 80) + '…' : signal.source_url}
          </a>
        )}
      </div>

      {/* AI Analysis */}
      {triage && (
        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={18} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-slate-100">AI Analysis</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScoreBar label="Kimi Score" score={triage.kimi_score} reason={triage.kimi_reason} />
            <ScoreBar label="OpenAI Score" score={triage.openai_score} reason={triage.openai_reason} />
          </div>
        </div>
      )}

      {/* Processed Summary */}
      {summaryData && (
        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <FileText size={16} className="text-brand-400" />
            Processed Summary
          </h2>

          {typeof summaryData.summary === 'string' && summaryData.summary && (
            <p className="text-sm text-slate-300 leading-relaxed">{summaryData.summary}</p>
          )}

          {Array.isArray(summaryData.key_takeaways) && summaryData.key_takeaways.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Key Takeaways</span>
              <ul className="space-y-1">
                {(summaryData.key_takeaways as string[]).map((t, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-brand-500 mt-1.5 w-1 h-1 rounded-full bg-brand-500 flex-shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {typeof summaryData.threat_level === 'string' && summaryData.threat_level && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Threat Level:</span>
              <span className="text-xs font-medium text-slate-300">{summaryData.threat_level}</span>
            </div>
          )}
        </div>
      )}

      {/* Polished Content */}
      {triage?.polished_content && (
        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">Polished Content</h2>
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {triage.polished_content}
          </div>
        </div>
      )}

      {/* Original Content */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">Original Content</h2>
        {signal.summary && (
          <p className="text-sm text-slate-400 leading-relaxed">{signal.summary}</p>
        )}
        {signal.full_content && signal.full_content !== signal.summary && (
          <details className="group">
            <summary className="text-xs text-brand-400 cursor-pointer hover:text-brand-300 transition-colors">
              Show full content
            </summary>
            <div className="mt-3 text-sm text-slate-400 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
              {signal.full_content}
            </div>
          </details>
        )}
      </div>

      {/* Image */}
      {signal.image_url && (
        <div className="bg-slate-800/40 border border-slate-800 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getImageUrl(signal.image_url) || ''}
            alt={signal.title}
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      {/* Tags / metadata */}
      {(signal.cve_ids?.length > 0 ||
        signal.threat_actors?.length > 0 ||
        signal.affected_products?.length > 0 ||
        signal.target_industries?.length > 0) && (
        <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-100">Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TagList label="CVEs" items={signal.cve_ids || []} linkPrefix="https://nvd.nist.gov/vuln/detail/" />
            <TagList label="Threat Actors" items={signal.threat_actors || []} />
            <TagList label="Affected Products" items={signal.affected_products || []} />
            <TagList label="Target Industries" items={signal.target_industries || []} />
            <TagList label="Target Regions" items={signal.target_regions || []} />
          </div>
        </div>
      )}

    </div>
  )
}
