/**
 * Global keyboard shortcuts hook for signal review workflow
 * 
 * Shortcuts:
 * - j/k: Navigate prev/next signal
 * - a: Approve current signal
 * - r: Reject current signal  
 * - s: Skip current signal
 * - u: Undo last action
 * - ?: Show help overlay
 * - Escape: Close modals/overlays
 */

import { useEffect, useCallback } from 'react'

export interface KeyboardShortcutHandlers {
  onNext?: () => void
  onPrev?: () => void
  onApprove?: () => void
  onReject?: () => void
  onSkip?: () => void
  onUndo?: () => void
  onHelp?: () => void
  onEscape?: () => void
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Ignore if modifiers are pressed (except Shift for ?)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      const key = event.key.toLowerCase()

      switch (key) {
        case 'j':
          event.preventDefault()
          handlers.onNext?.()
          break
        case 'k':
          event.preventDefault()
          handlers.onPrev?.()
          break
        case 'a':
          event.preventDefault()
          handlers.onApprove?.()
          break
        case 'r':
          event.preventDefault()
          handlers.onReject?.()
          break
        case 's':
          event.preventDefault()
          handlers.onSkip?.()
          break
        case 'u':
          event.preventDefault()
          handlers.onUndo?.()
          break
        case '?':
          event.preventDefault()
          handlers.onHelp?.()
          break
        case 'escape':
          event.preventDefault()
          handlers.onEscape?.()
          break
      }
    },
    [handlers]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])
}
