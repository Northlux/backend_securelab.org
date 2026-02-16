'use client'

import { useState } from 'react'
import { X, CheckCircle, XCircle, Star, ExternalLink } from 'lucide-react'
import { approveSignal, rejectSignal, retractSignal, toggleFeaturedSignal } from '@/app/actions/intel/signals'

interface Signal {
  id: string
  title: string
  summary: string | null
  full_content: string | null
  signal_category: string
  severity: string
  confidence_level: number
  source_url: string | null
  source_id: string | null
  cve_ids: string[]
  threat_actors: string[]
  target_industries: string[]
  target_regions: string[]
  affected_products: string[]
  is_verified: boolean
  is_featured: boolean
  publication_status: string
  rejection_reason: string | null
  created_at: string
  approved_at: string | null
  rejected_at: string | null
}

interface SignalDetailModalProps {
  signal: Signal | null
  isOpen: boolean
  onClose: () => void
  onAction: () => void
}

export function SignalDetailModal({ signal, isOpen, onClose, onAction }: SignalDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState<'ad' | 'irrelevant' | 'bad_content' | null>(null)
  const [showRejectReason, setShowRejectReason] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !signal) return null

  const handleApprove = async () => {
    setLoading(true)
    setError(null)
    try {
      await approveSignal(signal.id)
      onAction()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason) {
      setError('Please select a rejection reason')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await rejectSignal(signal.id, rejectionReason)
      onAction()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setLoading(false)
    }
  }

  const handleRetract = async () => {
    if (!confirm('Retract this published signal? It will return to pending status.')) return
    setLoading(true)
    setError(null)
    try {
      await retractSignal(signal.id)
      onAction()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retract')
    } finally {
      setLoading(false)
    }
  }

  const handleFeature = async () => {
    setLoading(true)
    setError(null)
    try {
      await toggleFeaturedSignal(signal.id, !signal.is_featured)
      onAction()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle featured')
    } finally {
      setLoading(false)
    }
  }

  const severityColor = {
    critical: 'bg-red-500/20 text-red-300 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    info: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  }

  const statusColor = {
    pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    approved: 'bg-green-500/10 text-green-300 border-green-500/30',
    rejected: 'bg-red-500/10 text-red-300 border-red-500/30',
    archived: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-2xl bg-slate-900 border-l border-slate-700 z-50 overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-100 truncate">{signal.title}</h2>
            <button
              onClick={handleFeature}
              disabled={loading || signal.publication_status !== 'approved'}
              className={`p-1.5 rounded transition-colors ${
                signal.is_featured
                  ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-500/10'
                  : 'text-slate-400 hover:text-yellow-400'
              } disabled:opacity-50`}
              title={signal.is_featured ? 'Unfeature' : 'Feature signal'}
            >
              <Star size={18} fill={signal.is_featured ? 'currentColor' : 'none'} />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Status & Severity Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Status</p>
              <div
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                  statusColor[(signal.publication_status || 'pending') as keyof typeof statusColor]
                }`}
              >
                {signal.publication_status
                  ? signal.publication_status.charAt(0).toUpperCase() + signal.publication_status.slice(1)
                  : 'Pending'}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Severity</p>
              <div
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                  severityColor[signal.severity as keyof typeof severityColor]
                }`}
              >
                {signal.severity.toUpperCase()}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Confidence</p>
              <div className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-300 text-sm font-medium">
                {signal.confidence_level}%
              </div>
            </div>
          </div>

          {/* Summary */}
          {signal.summary && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Summary</p>
              <p className="text-slate-300 text-sm leading-relaxed">{signal.summary}</p>
            </div>
          )}

          {/* Full Content */}
          {signal.full_content && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Full Content</p>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 max-h-48 overflow-y-auto">
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {signal.full_content}
                </p>
              </div>
            </div>
          )}

          {/* Category & Region */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Category</p>
              <p className="text-slate-300 text-sm capitalize">{signal.signal_category}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                Verified
              </p>
              <p className="text-slate-300 text-sm">
                {signal.is_verified ? (
                  <span className="text-green-300">✓ Verified</span>
                ) : (
                  <span className="text-yellow-300">⚠ Unverified</span>
                )}
              </p>
            </div>
          </div>

          {/* CVEs */}
          {signal.cve_ids && signal.cve_ids.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">CVE IDs</p>
              <div className="flex flex-wrap gap-2">
                {signal.cve_ids.map((cve) => (
                  <code
                    key={cve}
                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-cyan-300 font-mono"
                  >
                    {cve}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Threat Actors */}
          {signal.threat_actors && signal.threat_actors.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Threat Actors</p>
              <div className="flex flex-wrap gap-2">
                {signal.threat_actors.map((actor) => (
                  <span
                    key={actor}
                    className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300"
                  >
                    {actor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Target Industries */}
          {signal.target_industries && signal.target_industries.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                Target Industries
              </p>
              <div className="flex flex-wrap gap-2">
                {signal.target_industries.map((industry) => (
                  <span
                    key={industry}
                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Target Regions */}
          {signal.target_regions && signal.target_regions.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                Target Regions
              </p>
              <div className="flex flex-wrap gap-2">
                {signal.target_regions.map((region) => (
                  <span
                    key={region}
                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300"
                  >
                    {region}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source */}
          {signal.source_url && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Source</p>
              <a
                href={signal.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2 break-all"
              >
                {signal.source_url}
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Rejection Info */}
          {signal.publication_status === 'rejected' && signal.rejection_reason && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-xs text-red-400 uppercase tracking-wide mb-2">Rejection Reason</p>
              <p className="text-red-300 text-sm capitalize">{signal.rejection_reason.replace('_', ' ')}</p>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-slate-700 px-6 py-4 space-y-3">
          {showRejectReason ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">
                  Rejection Reason
                </label>
                <select
                  value={rejectionReason || ''}
                  onChange={(e) =>
                    setRejectionReason(
                      (e.target.value as 'ad' | 'irrelevant' | 'bad_content') || null
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-slate-100 text-sm"
                >
                  <option value="">Select reason...</option>
                  <option value="ad">Advertisement/Spam</option>
                  <option value="irrelevant">Irrelevant to threat intel</option>
                  <option value="bad_content">Low quality/misinformation</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  Confirm Reject
                </button>
                <button
                  onClick={() => {
                    setShowRejectReason(false)
                    setRejectionReason(null)
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              {signal.publication_status === 'approved' ? (
                <button
                  onClick={handleRetract}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-yellow-600/80 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Retract
                </button>
              ) : (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectReason(true)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600/80 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
