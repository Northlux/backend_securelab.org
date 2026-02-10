'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Copy,
  Download,
} from 'lucide-react'
import { validateSignalsJson, importSignalsFromJson, type ImportResults } from '@/lib/utils/import-signals-from-json'

interface PreviewSignal {
  title: string
  severity: string
  signal_category: string
  source_url?: string
}

// Group related state
interface InputState {
  jsonInput: string
  fileError: string
  skipDuplicates: boolean
  autoEnrich: boolean
}

interface ValidationState {
  errors: string[]
  isShowing: boolean
}

interface PreviewState {
  signals: PreviewSignal[]
  isShowing: boolean
}

interface ImportState {
  isRunning: boolean
  results: ImportResults | null
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ImportPage() {
  const router = useRouter()

  // ✅ Authorization state
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  // ✅ Grouped state - reduces re-renders
  const [input, setInput] = useState<InputState>({
    jsonInput: '',
    fileError: '',
    skipDuplicates: true,
    autoEnrich: true,
  })

  const [validation, setValidation] = useState<ValidationState>({
    errors: [],
    isShowing: false,
  })

  const [preview, setPreview] = useState<PreviewState>({
    signals: [],
    isShowing: false,
  })

  const [import_, setImport] = useState<ImportState>({
    isRunning: false,
    results: null,
  })

  // ✅ Check authorization on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        // ✅ Verify user has admin or analyst role
        const userRole = user.user_metadata?.role as string | undefined
        if (userRole !== 'admin' && userRole !== 'analyst') {
          console.warn('Unauthorized: User role is', userRole)
          setIsAuthorized(false)
          return
        }

        setIsAuthorized(true)
      } catch (err) {
        console.error('Auth check failed:', err)
        router.push('/login')
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // ✅ Memoized file upload handler
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // ✅ Validate file type
      if (!file.type || file.type !== 'application/json') {
        setInput(prev => ({ ...prev, fileError: 'Only JSON files are supported' }))
        return
      }

      // ✅ Validate extension
      if (!file.name.endsWith('.json')) {
        setInput(prev => ({ ...prev, fileError: 'File must have .json extension' }))
        return
      }

      // ✅ Check file size
      if (file.size > 5 * 1024 * 1024) {
        setInput(prev => ({ ...prev, fileError: 'File is too large (max 5MB)' }))
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          setInput(prev => ({
            ...prev,
            jsonInput: content,
            fileError: '',
          }))
          setValidation({ errors: [], isShowing: false })
          setImport({ isRunning: false, results: null })
        } catch (err) {
          setInput(prev => ({ ...prev, fileError: 'Failed to read file' }))
        }
      }
      reader.readAsText(file)
    },
    []
  )

  // ✅ Memoized validation handler
  const handleValidate = useCallback(() => {
    if (!input.jsonInput.trim()) {
      setValidation({ errors: ['No JSON provided'], isShowing: false })
      return
    }

    try {
      const jsonData = JSON.parse(input.jsonInput)
      const validationResult = validateSignalsJson(jsonData)

      if (!validationResult.valid) {
        setValidation({ errors: validationResult.errors, isShowing: false })
        setPreview({ signals: [], isShowing: false })
      } else {
        setValidation({ errors: [], isShowing: false })
        const signals = (jsonData.signals || []).map((signal: any) => ({
          title: signal.title,
          severity: signal.severity || 'medium',
          signal_category: signal.signal_category || 'news',
          source_url: signal.source_url,
        }))
        setPreview({ signals, isShowing: true })
      }
    } catch (err) {
      setValidation({
        errors: [
          'Invalid JSON: ' + (err instanceof Error ? err.message : 'Parse error'),
        ],
        isShowing: false,
      })
      setPreview({ signals: [], isShowing: false })
    }
  }, [input.jsonInput])

  // ✅ Memoized import handler with auth check
  const handleImport = useCallback(async () => {
    if (!input.jsonInput.trim()) return

    // ✅ Verify user is still authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setImport({
        isRunning: false,
        results: {
          imported: 0,
          skipped: 0,
          errors: ['Session expired. Please log in again.'],
          details: [],
        },
      })
      return
    }

    setImport(prev => ({ ...prev, isRunning: true }))
    try {
      const jsonData = JSON.parse(input.jsonInput)
      const results = await importSignalsFromJson(jsonData, {
        skipDuplicates: input.skipDuplicates,
        autoEnrich: input.autoEnrich,
      })
      setImport({ isRunning: false, results })
    } catch (err) {
      // ✅ Generic error message to client
      console.error('Import error:', err); // Detailed logging server-side
      setImport({
        isRunning: false,
        results: {
          imported: 0,
          skipped: 0,
          errors: ['Import failed. Please check your JSON format and try again.'],
          details: [],
        },
      })
    }
  }, [input])

  // ✅ Memoized clear handler
  const handleClear = useCallback(() => {
    setInput({
      jsonInput: '',
      fileError: '',
      skipDuplicates: true,
      autoEnrich: true,
    })
    setValidation({ errors: [], isShowing: false })
    setPreview({ signals: [], isShowing: false })
    setImport({ isRunning: false, results: null })
  }, [])

  // ✅ Memoized template handler
  const handleCopyTemplate = useCallback(() => {
    const template = {
      metadata: {
        import_source: 'manual',
        import_date: new Date().toISOString(),
      },
      signals: [
        {
          title: 'Example Critical Vulnerability in Popular Software',
          summary: 'A new vulnerability has been discovered',
          signal_category: 'vulnerability',
          severity: 'critical',
          source_url: 'https://example.com/vulnerability',
          cve_ids: ['CVE-2024-0001'],
          affected_products: ['Software X'],
        },
      ],
    }
    setInput(prev => ({
      ...prev,
      jsonInput: JSON.stringify(template, null, 2),
    }))
  }, [])

  const severityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'text-red-400',
      high: 'text-orange-400',
      medium: 'text-yellow-400',
      low: 'text-blue-400',
      info: 'text-slate-400',
    }
    return colors[severity] || colors.info
  }

  // ✅ Auth loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader size={32} className="animate-spin mx-auto mb-4 text-brand-400" />
          <p className="text-slate-400">Checking authorization...</p>
        </div>
      </div>
    )
  }

  // ✅ Auth failed state
  if (!isAuthorized) {
    return (
      <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-6">
        <div className="flex gap-2 text-red-300 font-semibold mb-2">
          <AlertCircle size={20} />
          Unauthorized Access
        </div>
        <p className="text-red-200">You do not have permission to access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Bulk Import Signals</h1>
        <p className="text-sm text-slate-400 mt-1">
          Import threat intelligence signals in JSON format with duplicate detection and auto-enrichment
        </p>
      </div>

      {/* File Upload Section */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Select JSON File</h2>

        <div className="space-y-3">
          <label htmlFor="json-file" className="text-sm font-medium text-slate-300">
            File Upload
          </label>
          <input
            id="json-file"
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            aria-label="Upload JSON file with threat signals"
            aria-describedby="file-help"
            className="block w-full text-sm text-slate-400
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-brand-600 file:text-white
              hover:file:bg-brand-700
              cursor-pointer"
          />
          <p id="file-help" className="text-xs text-slate-500">
            Maximum file size: 5MB. JSON format only.
          </p>

          {input.fileError && (
            <div className="flex gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded text-red-300 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {input.fileError}
            </div>
          )}

          <div className="text-sm text-slate-500">or</div>

          <label htmlFor="json-textarea" className="text-sm font-medium text-slate-300">
            Paste JSON
          </label>
          <textarea
            id="json-textarea"
            value={input.jsonInput}
            onChange={(e) =>
              setInput(prev => ({
                ...prev,
                jsonInput: e.target.value,
              }))
            }
            placeholder="Paste your JSON here..."
            rows={12}
            aria-label="Paste JSON content for import"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded font-mono text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
          />

          <button
            type="button"
            onClick={handleCopyTemplate}
            className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-2 transition-colors"
          >
            <Copy size={14} />
            Use template
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 space-y-2">
          <div className="flex gap-2 text-red-300 font-semibold">
            <XCircle size={18} />
            Validation Errors ({validation.errors.length})
          </div>
          <ul className="space-y-1 ml-6">
            {validation.errors.map((error, i) => (
              <li key={i} className="text-sm text-red-300 list-disc">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Section */}
      {preview.isShowing && preview.signals.length > 0 && !import_.results && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex items-center gap-2">
            <FileText size={18} className="text-brand-400" />
            <span className="font-semibold text-slate-100">Preview: {preview.signals.length} signals</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/30 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Title</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Category</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Severity</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Source URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {preview.signals.slice(0, 10).map((signal, i) => (
                  <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-slate-100 max-w-xs truncate">{signal.title}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{signal.signal_category}</td>
                    <td className={`px-4 py-3 text-xs font-semibold ${severityColor(signal.severity)}`}>
                      {signal.severity.toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs truncate">{signal.source_url || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.signals.length > 10 && (
            <div className="px-4 py-3 bg-slate-900/20 border-t border-slate-700 text-sm text-slate-400">
              ... and {preview.signals.length - 10} more signals
            </div>
          )}
        </div>
      )}

      {/* Options Section */}
      {!import_.results && input.jsonInput.trim() && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-slate-100">Import Options</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={input.skipDuplicates}
                onChange={(e) =>
                  setInput(prev => ({
                    ...prev,
                    skipDuplicates: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-300">Skip duplicate signals (URL and CVE matching)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={input.autoEnrich}
                onChange={(e) =>
                  setInput(prev => ({
                    ...prev,
                    autoEnrich: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-300">Auto-enrich signals (infer industries, calculate confidence)</span>
            </label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!import_.results && (
        <div className="flex gap-3">
          {input.jsonInput.trim() && !validation.errors.length && (
            <>
              {!preview.isShowing ? (
                <button
                  onClick={handleValidate}
                  className="px-4 py-2 bg-brand-600 text-white rounded font-medium hover:bg-brand-700 transition-colors flex items-center gap-2"
                >
                  <Upload size={16} />
                  Validate
                </button>
              ) : (
                <button
                  onClick={handleImport}
                  disabled={import_.isRunning}
                  className="px-4 py-2 bg-brand-600 text-white rounded font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {import_.isRunning ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Import Now
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {input.jsonInput.trim() && (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-slate-700 text-slate-100 rounded font-medium hover:bg-slate-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Results Section */}
      {import_.results && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Import Results</h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
                <div className="text-3xl font-bold text-green-400 flex items-center gap-2">
                  <CheckCircle size={24} />
                  {import_.results.imported}
                </div>
                <div className="text-sm text-slate-400 mt-1">Imported</div>
              </div>

              <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
                <div className="text-3xl font-bold text-yellow-400 flex items-center gap-2">
                  <AlertCircle size={24} />
                  {import_.results.skipped}
                </div>
                <div className="text-sm text-slate-400 mt-1">Skipped (Duplicates)</div>
              </div>

              <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
                <div className="text-3xl font-bold text-red-400 flex items-center gap-2">
                  <XCircle size={24} />
                  {import_.results.errors.length}
                </div>
                <div className="text-sm text-slate-400 mt-1">Errors</div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          {import_.results.details.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-4 bg-slate-900/50 border-b border-slate-700">
                <span className="font-semibold text-slate-100">Detailed Results</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/30 border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Signal</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {import_.results.details.map((detail, i) => (
                      <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3 text-slate-100 max-w-xs truncate">{detail.title}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
                              detail.status === 'imported'
                                ? 'text-green-300 bg-green-950/30'
                                : detail.status === 'skipped'
                                  ? 'text-yellow-300 bg-yellow-950/30'
                                  : 'text-red-300 bg-red-950/30'
                            }`}
                          >
                            {detail.status === 'imported' && <CheckCircle size={14} />}
                            {detail.status === 'skipped' && <AlertCircle size={14} />}
                            {detail.status === 'error' && <XCircle size={14} />}
                            {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{detail.error || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Summary */}
          {import_.results.errors.length > 0 && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 space-y-2">
              <div className="flex gap-2 text-red-300 font-semibold">
                <XCircle size={18} />
                General Errors ({import_.results.errors.length})
              </div>
              <ul className="space-y-1 ml-6">
                {import_.results.errors.map((error, i) => (
                  <li key={i} className="text-sm text-red-300 list-disc">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Done Button */}
          <button
            onClick={handleClear}
            className="w-full px-4 py-3 bg-brand-600 text-white rounded font-medium hover:bg-brand-700 transition-colors"
          >
            Import Another Batch
          </button>
        </div>
      )}
    </div>
  )
}
