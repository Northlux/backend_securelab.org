'use client'

interface TrendData {
  date: string
  count: number
}

interface SignalTrendChartProps {
  data: TrendData[]
  title?: string
}

export function SignalTrendChart({ data, title = 'Signals (Last 30 Days)' }: SignalTrendChartProps) {
  if (!data.length) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
        <div className="h-48 flex items-center justify-center text-slate-400">
          No data available
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const minDate = new Date(data[0].date)
  const maxDate = new Date(data[data.length - 1].date)

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>

      <div className="flex items-end gap-2 h-48 justify-between">
        {data.map((point, idx) => {
          const height = (point.count / maxCount) * 100
          const date = new Date(point.date)

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center group"
            >
              <div
                className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t transition-all hover:from-brand-500 hover:to-brand-300"
                style={{ height: `${height}%`, minHeight: '4px' }}
                title={`${point.date}: ${point.count} signals`}
              />
              <div className="text-xs text-slate-500 mt-1 group-hover:text-slate-300">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-xs text-slate-400 font-semibold hidden group-hover:block absolute -mt-8 bg-slate-900 px-2 py-1 rounded whitespace-nowrap">
                {point.count}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
        <div className="flex justify-between">
          <span>{minDate.toLocaleDateString()}</span>
          <span>{maxDate.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}
