'use client'

import { useSessionStats } from '@/lib/hooks/use-session-stats'
import { Clock, CheckCircle, XCircle, SkipForward, TrendingUp, RotateCcw } from 'lucide-react'

export function SessionStats() {
  const { stats, resetStats, formatTime } = useSessionStats()
  
  const approvalRate = stats.signalsReviewed > 0 
    ? (stats.approved / stats.signalsReviewed * 100).toFixed(1) 
    : '0.0'
  
  return (
    <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300">Session Performance</h3>
        <button
          onClick={resetStats}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
          title="Reset stats"
        >
          <RotateCcw size={14} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Reviewed */}
        <div className="bg-slate-900/40 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-brand-400" />
            <span className="text-xs text-slate-500">Reviewed</span>
          </div>
          <div className="text-2xl font-bold text-slate-200">{stats.signalsReviewed}</div>
        </div>
        
        {/* Signals per minute */}
        <div className="bg-slate-900/40 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-green-400" />
            <span className="text-xs text-slate-500">Per Minute</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {stats.signalsPerMinute.toFixed(1)}
          </div>
        </div>
        
        {/* Average time */}
        <div className="bg-slate-900/40 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-yellow-400" />
            <span className="text-xs text-slate-500">Avg Time</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {stats.averageTimePerSignal.toFixed(1)}s
          </div>
        </div>
        
        {/* Approval rate */}
        <div className="bg-slate-900/40 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={14} className="text-blue-400" />
            <span className="text-xs text-slate-500">Approval</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{approvalRate}%</div>
        </div>
      </div>
      
      {/* Detailed breakdown */}
      <div className="mt-3 pt-3 border-t border-slate-800/50 grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <CheckCircle size={12} className="text-green-500" />
          <span className="text-slate-500">Approved:</span>
          <span className="font-medium text-slate-300">{stats.approved}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle size={12} className="text-red-500" />
          <span className="text-slate-500">Rejected:</span>
          <span className="font-medium text-slate-300">{stats.rejected}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <SkipForward size={12} className="text-slate-500" />
          <span className="text-slate-500">Skipped:</span>
          <span className="font-medium text-slate-300">{stats.skipped}</span>
        </div>
      </div>
      
      {/* Session duration */}
      <div className="mt-2 text-xs text-center text-slate-600">
        Session: {formatTime(stats.totalTime)}
      </div>
    </div>
  )
}
