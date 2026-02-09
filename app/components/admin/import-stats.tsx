import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'

interface ImportLog {
  id: string
  created_at: string
  import_source: string
  signals_imported: number
  signals_skipped: number
  signals_errors: number
}

interface ImportStatsProps {
  imports: ImportLog[]
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export default function ImportStats({ imports }: ImportStatsProps) {
  const totalImported = imports.reduce((sum, imp) => sum + imp.signals_imported, 0)
  const totalSkipped = imports.reduce((sum, imp) => sum + imp.signals_skipped, 0)
  const totalErrors = imports.reduce((sum, imp) => sum + imp.signals_errors, 0)

  return (
    <div className="border border-slate-800 rounded-lg bg-slate-800/50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Recent Imports</h2>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 border-b border-slate-700 px-6 py-3 bg-slate-700/30">
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-400" size={18} />
          <div>
            <p className="text-slate-500 text-xs">Imported</p>
            <p className="text-white font-bold">{totalImported}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="text-yellow-400" size={18} />
          <div>
            <p className="text-slate-500 text-xs">Skipped</p>
            <p className="text-white font-bold">{totalSkipped}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="text-red-400" size={18} />
          <div>
            <p className="text-slate-500 text-xs">Errors</p>
            <p className="text-white font-bold">{totalErrors}</p>
          </div>
        </div>
      </div>

      {/* Import List */}
      <div className="space-y-0">
        {imports.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Clock className="mx-auto mb-3 text-slate-500" size={32} />
            <p className="text-slate-400">No imports yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Imports will appear here as signals are imported
            </p>
          </div>
        ) : (
          imports.map((imp, idx) => {
            const isSuccess = imp.signals_errors === 0
            const statusColor = isSuccess ? 'text-green-400' : 'text-orange-400'
            const statusIcon = isSuccess ? '✓' : '⚠'

            return (
              <div
                key={imp.id}
                className={`flex items-center justify-between px-6 py-4 border-b border-slate-700/50 hover:bg-slate-700/20 transition ${
                  idx === 0 ? '' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${statusColor}`}>{statusIcon}</span>
                    <div>
                      <p className="text-white font-medium capitalize">{imp.import_source}</p>
                      <p className="text-slate-500 text-sm">{formatTimeAgo(imp.created_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-sm">+{imp.signals_imported}</p>
                    <p className="text-slate-500 text-xs">imported</p>
                  </div>
                  {imp.signals_skipped > 0 && (
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold text-sm">~{imp.signals_skipped}</p>
                      <p className="text-slate-500 text-xs">skipped</p>
                    </div>
                  )}
                  {imp.signals_errors > 0 && (
                    <div className="text-right">
                      <p className="text-red-400 font-bold text-sm">{imp.signals_errors}</p>
                      <p className="text-slate-500 text-xs">errors</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
