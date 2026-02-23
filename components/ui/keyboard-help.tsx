'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface KeyboardShortcut {
  key: string
  action: string
  category: string
}

const shortcuts: KeyboardShortcut[] = [
  { key: 'J', action: 'Next signal', category: 'Navigation' },
  { key: 'K', action: 'Previous signal', category: 'Navigation' },
  { key: 'A', action: 'Approve signal', category: 'Actions' },
  { key: 'R', action: 'Reject signal', category: 'Actions' },
  { key: 'S', action: 'Skip signal', category: 'Actions' },
  { key: 'U', action: 'Undo last action', category: 'Actions' },
  { key: '?', action: 'Show this help', category: 'Other' },
  { key: 'Esc', action: 'Close modals', category: 'Other' },
]

export function KeyboardHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const categories = Array.from(new Set(shortcuts.map((s) => s.category)))

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/40"
                    >
                      <span className="text-sm text-slate-300">{shortcut.action}</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-slate-100 bg-slate-700 border border-slate-600 rounded">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            Keyboard shortcuts work globally when not typing in an input field.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
