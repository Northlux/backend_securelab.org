# Phase 1 Implementation Status

**Date:** 2026-02-23 22:15
**Status:** IN PROGRESS

---

## Completed Components

### ✅ 1. Keyboard Shortcuts Infrastructure
**File:** `lib/hooks/use-keyboard-shortcuts.ts`  
**Features:**
- Global keyboard event listener
- Ignores input fields (safe typing)
- Supports: j/k (nav), a/r/s (actions), u (undo), ? (help)
- Clean up on unmount

### ✅ 2. Help Overlay
**File:** `components/ui/keyboard-help.tsx`  
**Features:**
- Categorized shortcut list
- Modal dialog with shadcn Dialog
- Escape to close
- Keyboard-accessible

### ✅ 3. Undo API Endpoint
**File:** `app/api/v1/admin/signals/[id]/undo/route.ts`  
**Features:**
- Reverts signal to pending status
- Clears rejection reason
- Returns previous status for client feedback

### ✅ 4. AI Score Explanation
**File:** `components/ui/ai-score-explanation.tsx`  
**Features:**
- Tooltip on AI score badge
- Shows positive/negative factors
- Confidence indicator (high/medium/low)
- Auto-generates factors from signal data
- CVE detection
- Source credibility check
- Severity analysis

---

## In Progress

### 🔄 5. Intel Queue Integration
**File:** `app/components/intel/intel-queue.tsx`  
**Status:** Needs updating  
**Required Changes:**
- [ ] Import useKeyboardShortcuts hook
- [ ] Import KeyboardHelp component
- [ ] Add undo stack state (last 10 actions)
- [ ] Add help overlay state
- [ ] Add keyboard handlers (approve/reject/undo/help)
- [ ] Add auto-advance logic (after approve/reject)
- [ ] Add undo toast with button
- [ ] Connect keyboard shortcuts to existing actions

### 🔄 6. Signal Card Updates
**File:** `app/components/intel/signal-card.tsx`  
**Status:** Needs updating  
**Required Changes:**
- [ ] Replace AI score display with AIScoreExplanation component
- [ ] Add keyboard focus indication
- [ ] Add loading states for actions
- [ ] Improve mobile touch targets

---

## Implementation Plan

### Step 1: Update Intel Queue (30 min)
Add at top of intel-queue.tsx:
```typescript
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts'
import { KeyboardHelp } from '@/components/ui/keyboard-help'

// Inside IntelQueue component:
const [undoStack, setUndoStack] = useState<Array<{id: string, action: string}>>([])
const [showHelp, setShowHelp] = useState(false)
const [currentIndex, setCurrentIndex] = useState(0)

// Undo handler
const handleUndo = async () => {
  if (undoStack.length === 0) {
    toast.error('Nothing to undo')
    return
  }
  
  const lastAction = undoStack[undoStack.length - 1]
  try {
    const res = await fetch(`/api/v1/admin/signals/${lastAction.id}/undo`, {
      method: 'POST'
    })
    if (res.ok) {
      toast.success('Action undone')
      setUndoStack(prev => prev.slice(0, -1))
      fetchSignals()
      fetchStats()
    }
  } catch {
    toast.error('Failed to undo')
  }
}

// Auto-advance helper
const advanceToNext = () => {
  const nextIndex = Math.min(currentIndex + 1, signals.length - 1)
  setCurrentIndex(nextIndex)
  // Scroll to next signal or load next page if needed
}

// Keyboard shortcuts
useKeyboardShortcuts({
  onNext: () => setCurrentIndex(prev => Math.min(prev + 1, signals.length - 1)),
  onPrev: () => setCurrentIndex(prev => Math.max(prev - 1, 0)),
  onApprove: () => signals[currentIndex] && handleAction(signals[currentIndex].id, 'approve'),
  onReject: () => signals[currentIndex] && handleAction(signals[currentIndex].id, 'reject'),
  onUndo: handleUndo,
  onHelp: () => setShowHelp(true),
  onEscape: () => setShowHelp(false),
})

// Update handleAction to push to undo stack and auto-advance
const handleAction = async (id: string, action: string) => {
  // ... existing action logic ...
  
  // After successful action:
  setUndoStack(prev => [...prev, { id, action }].slice(-10)) // Keep last 10
  
  toast.success(`Signal ${action}d`, {
    action: {
      label: 'Undo',
      onClick: handleUndo,
    },
    duration: 10000, // 10 second window
  })
  
  advanceToNext() // Auto-advance
}

// Add help overlay to render:
<KeyboardHelp open={showHelp} onClose={() => setShowHelp(false)} />
```

### Step 2: Update Signal Card (15 min)
Replace AI score badge in signal-card.tsx:
```typescript
import { AIScoreExplanation } from '@/components/ui/ai-score-explanation'

// Inside SignalCard component, replace score display:
{triage && (triage.kimi_score || triage.openai_score) && (
  <AIScoreExplanation 
    score={triage.kimi_score || triage.openai_score || 0}
    signal={{
      signal_category: signal.signal_category,
      severity: signal.severity,
      source_url: signal.source_url,
      title: signal.title,
    }}
  />
)}
```

### Step 3: Add Current Signal Highlight (10 min)
Add visual indicator for keyboard-focused signal:
```typescript
// In intel-queue.tsx, pass currentIndex to SignalCard:
<SignalCard
  key={signal.id}
  signal={signal}
  selected={selected.has(signal.id)}
  focused={index === currentIndex} // NEW
  onSelect={handleSelect}
  onAction={handleAction}
/>

// In signal-card.tsx, add focused prop and styling:
className={`... ${focused ? 'ring-2 ring-brand-500' : ''}`}
```

### Step 4: Mobile Swipe Gestures (20 min)
Add touch event handlers to signal-card.tsx:
```typescript
const [touchStart, setTouchStart] = useState(0)
const [touchEnd, setTouchEnd] = useState(0)

const handleTouchStart = (e: React.TouchEvent) => {
  setTouchStart(e.targetTouches[0].clientX)
}

const handleTouchMove = (e: React.TouchEvent) => {
  setTouchEnd(e.targetTouches[0].clientX)
}

const handleTouchEnd = () => {
  if (touchStart - touchEnd > 150) {
    // Swipe left = reject
    handleAction('reject')
  }
  if (touchEnd - touchStart > 150) {
    // Swipe right = approve
    handleAction('approve')
  }
}

// Add to card div:
onTouchStart={handleTouchStart}
onTouchMove={handleTouchMove}
onTouchEnd={handleTouchEnd}
```

---

## Testing Checklist

### Keyboard Shortcuts
- [ ] j/k navigation works without clicking anything
- [ ] a/r/s work on currently focused signal
- [ ] ? shows help overlay
- [ ] Escape closes help overlay
- [ ] Shortcuts don't fire when typing in search/filter inputs
- [ ] u undoes last action

### Undo Functionality
- [ ] Toast appears after approve/reject with undo button
- [ ] Clicking undo reverts the decision
- [ ] Toast dismisses after 10 seconds
- [ ] Multiple undos work (stack of 10)
- [ ] Undo button disappears after grace period

### Auto-Advance
- [ ] After approve, next signal is shown
- [ ] After reject, next signal is shown
- [ ] Maintains filter state
- [ ] Works at end of list (doesn't break)
- [ ] Works with pagination (loads next page if needed)

### AI Explanation
- [ ] Clicking score shows tooltip
- [ ] Positive factors listed correctly
- [ ] Negative factors listed correctly
- [ ] Confidence badge shows correct level
- [ ] CVE detection works
- [ ] Source credibility shown
- [ ] Tooltip closes properly

### Mobile
- [ ] Swipe right approves
- [ ] Swipe left rejects
- [ ] Touch targets are large enough (44x44px min)
- [ ] No accidental swipes while scrolling
- [ ] Undo toast is accessible on mobile

---

## Next Steps (Week 2)

1. Performance optimization (keyboard lag <100ms)
2. Animation polish (smooth transitions)
3. AI feedback loop (track decisions for learning)
4. Weekly accuracy reports
5. Confidence threshold settings
6. Skip queue (separate view for skipped signals)
7. Session stats (signals reviewed today, speed metrics)

---

## Files Modified

1. `lib/hooks/use-keyboard-shortcuts.ts` (new)
2. `components/ui/keyboard-help.tsx` (new)
3. `components/ui/ai-score-explanation.tsx` (new)
4. `app/api/v1/admin/signals/[id]/undo/route.ts` (new)
5. `app/components/intel/intel-queue.tsx` (update pending)
6. `app/components/intel/signal-card.tsx` (update pending)

---

## Estimated Time Remaining

- Intel queue updates: 30 min
- Signal card updates: 15 min
- Current signal highlight: 10 min
- Mobile swipe gestures: 20 min
- Testing & bug fixes: 30 min
- **Total: ~2 hours**

---

## Deployment Notes

1. Run type check: `pnpm type-check`
2. Test locally: `pnpm dev`
3. Test keyboard shortcuts in browser
4. Test on mobile device (iOS Safari, Android Chrome)
5. Verify undo API endpoint works
6. Check toast notifications appear correctly
7. Deploy to staging first
8. Get user feedback before production
