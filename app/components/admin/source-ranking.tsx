'use client'

interface SourceRank {
  sourceName: string
  count: number
}

interface SourceRankingProps {
  data: SourceRank[]
  title?: string
}

export function SourceRanking({ data, title = 'Top Sources by Signal Count' }: SourceRankingProps) {
  if (!data.length) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
        <div className="text-slate-400 text-center py-8">No source data</div>
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>

      <div className="space-y-3">
        {data.slice(0, 5).map((source, idx) => {
          const percentage = (source.count / maxCount) * 100

          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-200 font-medium truncate">{source.sourceName}</span>
                <span className="text-slate-400 ml-2 flex-shrink-0">{source.count}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-600 to-brand-400 h-full transition-all rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {data.length > 5 && (
        <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-400">
          ... and {data.length - 5} more sources
        </div>
      )}
    </div>
  )
}
