'use client'

import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ScoreFactors {
  positive: string[]
  negative: string[]
  confidence: 'high' | 'medium' | 'low'
}

interface AIScoreExplanationProps {
  score: number
  factors?: ScoreFactors
  signal?: {
    signal_category?: string
    severity?: string
    source_url?: string
    title?: string
  }
}

function generateFactors(signal: AIScoreExplanationProps['signal'], score: number): ScoreFactors {
  const positive: string[] = []
  const negative: string[] = []

  // Analyze based on available signal data
  if (signal?.signal_category) {
    const highValueCategories = ['vulnerability', 'breach', 'ransomware', 'exploit']
    if (highValueCategories.includes(signal.signal_category)) {
      positive.push(`High-value category: ${signal.signal_category}`)
    }
  }

  if (signal?.severity) {
    const criticalSeverities = ['critical', 'high']
    if (criticalSeverities.includes(signal.severity)) {
      positive.push(`${signal.severity.charAt(0).toUpperCase() + signal.severity.slice(1)} severity`)
    }
  }

  if (signal?.title) {
    // Check for CVEs
    if (/CVE-\d{4}-\d+/i.test(signal.title)) {
      positive.push('Contains CVE identifier')
    }
    // Check for technical depth
    if (signal.title.length > 50) {
      positive.push('Detailed technical title')
    }
    // Check for vendor/product mentions
    if (/\b(Apache|Microsoft|Google|Adobe|Oracle|Cisco)\b/i.test(signal.title)) {
      positive.push('Major vendor mentioned')
    }
  }

  if (signal?.source_url) {
    // Check for trusted sources
    const trustedDomains = ['thehackernews.com', 'bleepingcomputer.com', 'krebsonsecurity.com', 'securelist.com']
    if (trustedDomains.some(domain => signal.source_url?.includes(domain))) {
      positive.push('Trusted news source')
    }
  }

  // Generate negative factors based on score
  if (score < 70) {
    if (!signal?.title?.match(/CVE-\d{4}-\d+/i)) {
      negative.push('No CVE identifier found')
    }
    if (signal?.signal_category === 'news') {
      negative.push('General news category (lower priority)')
    }
  }

  // Determine confidence based on score and factors
  let confidence: 'high' | 'medium' | 'low'
  if (score >= 75 && positive.length >= 3) {
    confidence = 'high'
  } else if (score >= 50 && positive.length >= 2) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  return { positive, negative, confidence }
}

export function AIScoreExplanation({ score, factors, signal }: AIScoreExplanationProps) {
  const computedFactors = factors || generateFactors(signal, score)

  const scoreColor =
    score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'

  const confidenceBadge = {
    high: { text: 'High', color: 'text-green-400 bg-green-500/15' },
    medium: { text: 'Medium', color: 'text-yellow-400 bg-yellow-500/15' },
    low: { text: 'Low', color: 'text-red-400 bg-red-500/15' },
  }[computedFactors.confidence]

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700 hover:border-slate-600 transition-all group">
            <span className="text-xs text-slate-400">AI Score:</span>
            <span className={`text-sm font-semibold ${scoreColor}`}>{score}</span>
            <Info size={12} className="text-slate-500 group-hover:text-slate-400 transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="w-80 p-4 bg-slate-900 border-slate-800"
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-100">
                AI Scoring Analysis
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded-full ${confidenceBadge.color}`}>
                {confidenceBadge.text} Confidence
              </span>
            </div>

            {/* Score visualization */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Score</span>
                <span className={`font-semibold ${scoreColor}`}>{score}/100</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    score >= 70
                      ? 'bg-green-500'
                      : score >= 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {/* Positive factors */}
            {computedFactors.positive.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-medium text-green-400">Positive Factors</h5>
                <ul className="space-y-1">
                  {computedFactors.positive.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Negative factors */}
            {computedFactors.negative.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-medium text-red-400">Areas for Improvement</h5>
                <ul className="space-y-1">
                  {computedFactors.negative.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-red-400 mt-0.5">✗</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer note */}
            <p className="text-xs text-slate-500 pt-2 border-t border-slate-800">
              AI learns from your decisions to improve future scoring.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
