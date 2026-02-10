'use client'

interface SeverityData {
  severity: string
  count: number
}

interface SeverityDistributionProps {
  data: SeverityData[]
  title?: string
}

const severityOrder = ['critical', 'high', 'medium', 'low', 'info']
const severityColors: Record<string, { bg: string; text: string; dot: string }> = {
  critical: { bg: 'bg-red-500/20', text: 'text-red-300', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-300', dot: 'bg-orange-500' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', dot: 'bg-yellow-500' },
  low: { bg: 'bg-blue-500/20', text: 'text-blue-300', dot: 'bg-blue-500' },
  info: { bg: 'bg-slate-500/20', text: 'text-slate-300', dot: 'bg-slate-500' },
}

export function SeverityDistribution({ data, title = 'Signals by Severity' }: SeverityDistributionProps) {
  if (!data.length) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
        <div className="text-slate-400 text-center py-8">No severity data</div>
      </div>
    )
  }

  const sortedData = [...data].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  )

  const total = sortedData.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>

      <div className="space-y-3">
        {sortedData.map((item) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0
          const colors = severityColors[item.severity] || severityColors.info

          return (
            <div key={item.severity} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span className={`font-medium capitalize ${colors.text}`}>{item.severity}</span>
                </div>
                <div className="text-slate-400">
                  <span className="font-semibold">{item.count}</span>
                  <span className="text-xs ml-1">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all rounded-full ${colors.bg.replace('20', '').replace('/20', '')}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
        <span>Total: </span>
        <span className="font-semibold text-slate-100">{total}</span>
      </div>
    </div>
  )
}
