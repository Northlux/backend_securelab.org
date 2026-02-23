# Signal Approval UX - Executive Summary

**Date:** 2026-02-23  
**Priority:** HIGH (must be fixed before subscriptions)

---

## Current Problems

Your instinct is right - the signal approval workflow is not good. Here's why:

**Problem 1: Too Slow**
- Every approval requires: checkbox → button → wait for reload
- Rejection adds a modal popup (extra clicks)
- No keyboard shortcuts for power users
- Result: Can only review ~5-10 signals per minute

**Problem 2: Information Overload**
- Cards show 10+ pieces of data per signal
- Hard to scan quickly
- Takes cognitive effort to find what matters
- Result: Decision fatigue after 20-30 signals

**Problem 3: No Safety Net**
- Can't undo mistakes
- Accidental clicks are permanent
- Creates anxiety and slows decisions
- Result: Reviewers become overly cautious

**Problem 4: Poor Context**
- AI score shown but no explanation WHY
- Can't see similar signals (duplicates)
- No source credibility visible
- Result: Can't make informed decisions quickly

---

## What Good Looks Like

I researched how the best platforms handle approval workflows:

### Pattern 1: Reddit Mod Queue (Speed Focus)
- One signal at a time, full screen
- Keyboard shortcuts: 'a' for approve, 'r' for reject, 'j/k' for next/prev
- Auto-advance after decision
- Undo last 10 actions
- **Speed:** Can review 30-60 items per minute

### Pattern 2: Gmail Inbox (Familiar UX)
- List on left, detail on right
- Up/down arrows to navigate
- Actions appear when selected
- Smart filters ("Unread", "Important")
- Snooze for "deal with later"

### Pattern 3: GitHub PR Review (Collaboration)
- Thread of comments for discussion
- Clear approve/reject/request-changes
- Inline feedback
- Required reviewers
- Good for teams

---

## Recommended Solution: Focused Triage Mode

**Primary Mode:** Full-screen, one signal at a time

**How It Works:**
1. See one signal with full context (title, summary, AI reasoning)
2. Press 'a' to approve (or click button)
3. Automatically advance to next signal
4. Press 'u' to undo if you made a mistake
5. Skip uncertain signals (review them later)

**Why This Works:**
- Maximum focus (no distractions)
- Fastest possible (keyboard-driven)
- Low cognitive load (one decision at a time)
- Safe (undo mistakes)
- Mobile-friendly (swipe left/right)

**Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│ Signal 12 of 45 pending                            [Skip ⏭] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🔴 CRITICAL                 AI Score: 82/100 ⓘ             │
│                                                               │
│  CVE-2026-12345: Critical RCE in Apache Tomcat              │
│                                                               │
│  A critical remote code execution vulnerability has been     │
│  discovered in Apache Tomcat versions 9.0.0 through         │
│  9.0.65...                                                   │
│                                                               │
│  Why AI scored this 82:                                      │
│  ✓ Contains CVE (high value)                                │
│  ✓ Critical severity                                        │
│  ✓ Trusted source (The Hacker News, 95% trust)             │
│  ✗ No proof-of-concept linked                               │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│          [A] Approve      [R] Reject      [?] Help           │
└─────────────────────────────────────────────────────────────┘
```

**Secondary Mode:** List view for bulk operations (keep current interface, just improve it)

---

## Implementation Plan

### Phase 1: Quick Wins (1-2 weeks)

**Add keyboard shortcuts:**
- j/k for prev/next signal
- a for approve, r for reject, s for skip
- u for undo
- ? to show help

**Add undo:**
- Toast notification with undo button
- 10-second grace period
- Undo stack (can undo multiple actions)

**Add auto-advance:**
- After approve/reject, show next signal automatically
- No need to click "next" every time

**Add AI explanation:**
- Click on score to see why AI scored it
- Show factors that contributed

**Result:** 2-3x faster reviews with ZERO extra UI

### Phase 2: Enhanced List View (3-4 weeks)

Improve current `/admin/intel` page:
- Smaller cards (fit more on screen - 50% height reduction)
- Inline actions (no modals for common operations)
- Hover previews (tooltip with full summary)
- Quick filters (chips above list)
- Saved views (user preferences)
- Session stats and progress tracking

### Phase 3: Analytics & AI Learning (5-6 weeks)

Intelligence and automation:
- Personal review stats dashboard
- AI accuracy tracking
- Pattern detection (approval/rejection trends)
- Confidence threshold settings
- Weekly accuracy reports
- AI auto-approval for high-confidence signals

---

## Workflow

**Keyboard-Driven List Review:** Primary workflow (current implementation)
- Fast, efficient (15-20 signals/minute with Phase 1)
- Handles high volume
- Good for mobile

**List View:** Weekly bulk operations
- Review specific categories
- Bulk approve/reject by criteria
- Data analysis

**Kanban Board:** Team coordination (future)
- Visual workflow status
- Assign signals to people
- Track progress

---

## Questions for You

Before I start building, I need to know:

1. **Workflow:** Do you review signals once per day in batches, or throughout the day?

2. **Volume:** How many signals per day do you review? (10? 50? 100?)

3. **Device:** Desktop only, or also mobile/tablet?

4. **Rejection Reasons:** Are the current categories good, or need changes?

5. **AI Trust:** How much do you trust the AI score? Should we show it prominently or hide it?

6. **Collaboration:** Just you, or will others (Muttley, team) also review signals?

7. **Priority:** Which Phase 1 feature matters most to you? (Keyboard shortcuts, undo, auto-advance, or AI explanation?)

---

## Expected Impact

**Before (Current):**
- 5-10 signals per minute
- High cognitive load
- Anxiety about mistakes
- Frequent context switching

**After (Phase 1 Only):**
- 15-20 signals per minute (3x faster)
- Lower cognitive load (less clicking)
- No mistake anxiety (undo available)
- Smooth flow (auto-advance)

**After (Phase 1 + 2):**
- 20-30 signals per minute (5x faster)
- Minimal cognitive load (one thing at a time)
- Mobile-friendly (review anywhere)
- Gamified (progress tracking, speed metrics)

---

## Next Steps

1. **Answer the questions above** so I know your exact needs
2. **Pick which phase to start with** (recommend Phase 1 for quick wins)
3. **I'll build it** (1-2 weeks for Phase 1)
4. **Test with real signals** and iterate
5. **Measure improvement** (speed, accuracy, satisfaction)

---

**Full Research:** See `SIGNAL_APPROVAL_UX_RESEARCH.md` for 20KB of detailed analysis, industry examples, and component specs.

**Priority Confirmed:** Subscriptions/payments are now absolute LAST phase. Focus is on making the core workflow excellent first.
