'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning'
  message: string
}

let addToastFn: ((toast: Omit<Toast, 'id'>) => void) | null = null

export function showToast(type: Toast['type'], message: string) {
  addToastFn?.({ type, message })
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    addToastFn = (toast) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { ...toast, id }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    }
    return () => {
      addToastFn = null
    }
  }, [])

  const icons = {
    success: <CheckCircle size={16} className="text-green-400" />,
    error: <XCircle size={16} className="text-red-400" />,
    warning: <AlertTriangle size={16} className="text-yellow-400" />,
  }

  const bg = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg ${bg[toast.type]} animate-in slide-in-from-bottom-2`}
        >
          {icons[toast.type]}
          <span className="text-sm text-slate-200">{toast.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="ml-2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
