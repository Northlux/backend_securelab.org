'use client'

import { useState } from 'react'
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

export default function ImportPage() {
  const [jsonInput, setJsonInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [previewSignals, setPreviewSignals] = useState<PreviewSignal[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [autoEnrich, setAutoEnrich] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResults | null>(null)
  const [fileError, setFileError] = useState('')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File is too large (max 5MB)')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        setJsonInput(content)
        setFileError('')
        setValidationErrors([])
        setImportResults(null)
      } catch (err) {
        setFileError('Failed to read file')
      }
    }
    reader.readAsText(file)
  }

  const handleValidate = () => {
    if (!jsonInput.trim()) {
      setValidationErrors(['No JSON provided'])
      return
    }

    try {
      const jsonData = JSON.parse(jsonInput)
      const validation = validateSignalsJson(jsonData)

      if (!validation.valid) {
        setValidationErrors(validation.errors)
        setPreviewSignals([])
        setShowPreview(false)
      } else {
        setValidationErrors([])
        const signals = (jsonData.signals || []).map((signal: any) => ({
          title: signal.title,
          severity: signal.severity || 'medium',
          signal_category: signal.signal_category || 'news',
          source_url: signal.source_url,
        }))
        setPreviewSignals(signals)
        setShowPreview(true)
      }
    } catch (err) {
      setValidationErrors([
        'Invalid JSON: ' + (err instanceof Error ? err.message : 'Parse error'),
      ])
      setPreviewSignals([])
      setShowPreview(false)
    }
  }

  const handleImport = async () => {
    if (!jsonInput.trim()) return

    setImporting(true)
    try {
      const jsonData = JSON.parse(jsonInput)
      const results = await importSignalsFromJson(jsonData, {
        skipDuplicates,
        autoEnrich,
      })
      setImportResults(results)
    } catch (err) {
      setImportResults({
        imported: 0,
        skipped: 0,
        errors: ['Import failed: ' + (err instanceof Error ? err.message : 'Unknown error')],
        details: [],
      })
    } finally {
      setImporting(false)
    }
  }

  const handleClear = () => {
    setJsonInput('')
    setValidationErrors([])
    setPreviewSignals([])
    setShowPreview(false)
    setImportResults(null)
    setFileError('')
  }

  const handleCopyTemplate = () => {
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
    setJsonInput(JSON.stringify(template, null, 2))
  }

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
          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-400
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-brand-600 file:text-white
                hover:file:bg-brand-700
                cursor-pointer"
            />
          </label>

          {fileError && (
            <div className="flex gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded text-red-300 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {fileError}
            </div>
          )}

          <div className="text-sm text-slate-500">or</div>

          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON here..."
            rows={12}
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
      {validationErrors.length > 0 && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 space-y-2">
          <div className="flex gap-2 text-red-300 font-semibold">
            <XCircle size={18} />
            Validation Errors ({validationErrors.length})
          </div>
          <ul className="space-y-1 ml-6">
            {validationErrors.map((error, i) => (
              <li key={i} className="text-sm text-red-300 list-disc">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Section */}
      {showPreview && previewSignals.length > 0 && !importResults && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex items-center gap-2">
            <FileText size={18} className="text-brand-400" />
            <span className="font-semibold text-slate-100">Preview: {previewSignals.length} signals</span>
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
                {previewSignals.slice(0, 10).map((signal, i) => (
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

          {previewSignals.length > 10 && (
            <div className="px-4 py-3 bg-slate-900/20 border-t border-slate-700 text-sm text-slate-400">
              ... and {previewSignals.length - 10} more signals
            </div>
          )}
        </div>
      )}

      {/* Options Section */}
      {!importResults && jsonInput.trim() && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-slate-100">Import Options</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-300">Skip duplicate signals (URL and CVE matching)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoEnrich}
                onChange={(e) => setAutoEnrich(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-300">Auto-enrich signals (infer industries, calculate confidence)</span>
            </label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!importResults && (
        <div className="flex gap-3">
          {jsonInput.trim() && !validationErrors.length && (
            <>
              {!showPreview ? (
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
                  disabled={importing}
                  className="px-4 py-2 bg-brand-600 text-white rounded font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {importing ? (
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

          {jsonInput.trim() && (
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
      {importResults && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Import Results</h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
                <div className="text-3xl font-bold text-green-400 flex items-center gap-2">
                  <CheckCircle size={24} />
                  {importResults.imported}
                </div>
                <div className="text-sm text-slate-400 mt-1">Imported</div>
              </div>

              <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
                <div className="text-3xl font-bold text-yellow-400 flex items-center gap-2">
                  <AlertCircle size={24} />
                  {importResults.skipped}
                </div>
                <div className="text-sm text-slate-400 mt-1">Skipped (Duplicates)</div>
              </div>

              <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
                <div className="text-3xl font-bold text-red-400 flex items-center gap-2">
                  <XCircle size={24} />
                  {importResults.errors.length}
                </div>
                <div className="text-sm text-slate-400 mt-1">Errors</div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          {importResults.details.length > 0 && (
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
                    {importResults.details.map((detail, i) => (
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
          {importResults.errors.length > 0 && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 space-y-2">
              <div className="flex gap-2 text-red-300 font-semibold">
                <XCircle size={18} />
                General Errors ({importResults.errors.length})
              </div>
              <ul className="space-y-1 ml-6">
                {importResults.errors.map((error, i) => (
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
