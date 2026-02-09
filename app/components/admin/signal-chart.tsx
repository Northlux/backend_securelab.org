'use client'

import { PieChart } from 'lucide-react'

interface SignalCategory {
  signal_category: string
  count: number
}

interface SignalChartProps {
  data: SignalCategory[]
}

export default function SignalChart({ data }: SignalChartProps) {
  // Colors for each category
  const categoryColors: Record<string, string> = {
    cve: 'bg-red-500',
    vulnerability: 'bg-red-400',
    advisory: 'bg-orange-500',
    malware: 'bg-purple-500',
    apt: 'bg-pink-500',
    exploit: 'bg-rose-500',
    incident: 'bg-yellow-500',
    news: 'bg-blue-500',
    research: 'bg-cyan-500',
  }

  const categoryBgColors: Record<string, string> = {
    cve: 'bg-red-500/10',
    vulnerability: 'bg-red-400/10',
    advisory: 'bg-orange-500/10',
    malware: 'bg-purple-500/10',
    apt: 'bg-pink-500/10',
    exploit: 'bg-rose-500/10',
    incident: 'bg-yellow-500/10',
    news: 'bg-blue-500/10',
    research: 'bg-cyan-500/10',
  }

  const sortedData = [...data].sort((a, b) => b.count - a.count)
  const maxCount = sortedData.length > 0 ? (sortedData[0]?.count ?? 1) : 1
  const total = sortedData.reduce((sum, cat) => sum + cat.count, 0)

  return (
    <div className="border border-slate-800 rounded-lg bg-slate-800/50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-700 px-6 py-4 flex items-center gap-3">
        <PieChart className="text-brand-blue" size={20} />
        <h2 className="text-xl font-bold text-white">Signals by Category</h2>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {sortedData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">No signals yet</p>
            <p className="text-slate-500 text-sm mt-1">Signals will appear here as they are imported</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedData.map((category) => {
              const percentage = (category.count / total) * 100
              const barWidth = (category.count / maxCount) * 100
              const catName = category.signal_category ?? 'unknown'
              const color = categoryColors[catName] || 'bg-slate-500'
              const bgColor = categoryBgColors[catName] || 'bg-slate-500/10'

              return (
                <div key={catName} className="space-y-2">
                  {/* Label */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${color}`} />
                      <span className="text-white font-medium capitalize">{category.signal_category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 font-bold">{category.count}</span>
                      <span className="text-slate-500 text-sm min-w-[40px] text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className={`h-2 rounded-full overflow-hidden ${bgColor}`}>
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{
                        width: `${Math.max(barWidth, 2)}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}

            {/* Total */}
            <div className="pt-4 border-t border-slate-700 mt-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total Signals</span>
                <span className="text-2xl font-bold text-white">{total}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
