# Signal Approval UX Research & Best Practices

**Date:** 2026-02-23  
**Goal:** Redesign the signal approval workflow based on industry best practices

---

## Current State Analysis

### What Exists Now

**Interface:**
- Grid of signal cards with checkboxes
- Approve/Reject buttons on each card
- Bulk actions bar when items selected
- Filters for status, category, severity
- Pagination controls
- Stats cards showing totals
- Rejection reason modal with predefined options

**User Flow:**
1. View list of signals (default: all)
2. Click filters to narrow down
3. Select signals via checkbox
4. Click approve/reject buttons
5. For reject: choose reason from modal
6. Page refreshes to show updated list

### Current Problems (Identified)

1. **Cognitive Overload:**
   - Too much information per card (title, summary, category, severity, scores, dates)
   - Hard to scan quickly
   - Cards are vertically large, limiting signals visible per screen

2. **Slow Approval Flow:**
   - Requires multiple clicks per signal (checkbox → button → confirm)
   - No keyboard shortcuts for power users
   - Modal interrupts flow for rejection reasons
   - Full page reload after each action

3. **Poor Context:**
   - Limited preview of content
   - No way to see full article without leaving page
   - Can't compare signals side-by-side
   - No historical rejection data visible

4. **Inefficient Bulk Operations:**
   - Must scroll and select items manually
   - Can't select by criteria (e.g., "select all pending from today")
   - Bulk reject requires same modal for all items (can't have per-item reasons)

5. **No Undo:**
   - Mistakes are permanent
   - No way to reverse accidental approvals
   - Creates anxiety for reviewers

6. **Limited Context for Decision:**
   - AI scores shown but no explanation of why
   - No similar signals comparison
   - Can't see source credibility metrics
   - No link to previous signals from same source

---

## Industry Best Practices Research

### 1. Content Moderation Platforms

**Reddit Mod Queue:**
- Single-column feed (not grid)
- Large preview area
- Keyboard shortcuts (j/k for next/prev, a for approve, r for remove)
- Inline actions (no modal for common operations)
- "Ignore reports" for noise reduction
- Undo recent actions (toast with undo button)

**Discord Trust & Safety Dashboard:**
- Priority queue (highest risk first)
- Quick actions bar (always visible, no scrolling)
- Bulk selection with smart filters ("select all reported today")
- Preview panel on right side (split view)
- Context sidebar (user history, similar reports)
- Keyboard-first design

**Facebook Content Review Tool:**
- Swipe interface on mobile (inspired by Tinder)
- Hotkeys for desktop (1-5 for different actions)
- Auto-advance after decision
- Severity-based sorting
- ML confidence shown with explanation
- Appeal/escalate option for uncertain cases

### 2. Workflow Approval Tools

**GitHub Pull Request Review:**
- Conversation thread (context for decisions)
- File diff view (see what changed)
- Inline comments on specific lines
- "Request changes" vs "Approve" distinction
- Required reviewers + optional reviewers
- Batch approval for multiple PRs

**Jira Approval Workflow:**
- Kanban board view (visual status)
- Drag-and-drop to change status
- Quick filters (assigned to me, urgent, overdue)
- Comments/discussion thread
- Attachments and linked issues
- Audit log of all changes

**Notion Database Views:**
- Table, board, calendar, gallery views (same data, different UX)
- Custom filters and sorts
- Grouping by property
- Quick edit inline (no modal)
- Keyboard navigation (arrow keys, enter to edit)
- Formulas for calculated fields

### 3. Queue-Based Systems

**Zendesk Ticket Queue:**
- List view optimized for speed
- One-click macros (predefined responses + actions)
- View options (compact/comfortable/list)
- Saved views (personal + shared)
- Time tracking (SLA indicators)
- Next ticket button (auto-advance)

**Gmail Inbox (Priority Inbox):**
- Auto-categorization (important, unread, starred)
- Keyboard shortcuts (e for archive, r for reply)
- Select tools (all, none, read, unread)
- Undo send (grace period for mistakes)
- Snooze (defer to later)
- Search-based filters

**Tinder Swipe Interface:**
- Minimal UI (focus on content)
- Binary choice (left/right, yes/no)
- Instant feedback (visual animation)
- Undo last action (premium feature)
- Queue never ends (infinite scroll)
- Gamified (streak counters, progress)

---

## Key UX Principles for Approval Workflows

### 1. Speed & Efficiency

**Keyboard Shortcuts:**
- Essential for power users
- Industry standard: j/k for next/prev, a/r for approve/reject
- Must be discoverable (help overlay with ?)
- Should work globally (no need to click into fields first)

**Auto-Advance:**
- After approve/reject, automatically show next item
- Save reviewers from clicking "next" every time
- Maintain context (filter state, position in queue)

**Inline Actions:**
- No modals for common operations
- Buttons visible without hovering
- Clear visual feedback (loading states, success/error)

**Batch Operations:**
- Smart selection (by date, category, score range)
- Preview before bulk action
- Progress indicator for large batches
- Cancel mid-operation if needed

### 2. Context & Information Hierarchy

**Progressive Disclosure:**
- Show essential info by default (title, source, score)
- Hide details until needed (full summary, metadata)
- Expand on demand (accordion, modal, or side panel)

**Visual Hierarchy:**
- Most important = largest/boldest (signal title)
- Actionable items = high contrast (approve/reject buttons)
- Metadata = subtle (dates, IDs, technical fields)
- Use color sparingly (only for status/severity)

**Comparison Tools:**
- Side-by-side view for similar signals
- Duplicate detection
- "More from this source" link
- Historical data (acceptance rate for this category)

### 3. Error Prevention & Recovery

**Undo Last Action:**
- Toast notification with undo button (10 second window)
- Undo stack (can undo multiple actions)
- Visual feedback (item fades out with undo option)

**Confirmation for Bulk:**
- Preview how many items affected
- Show sample of what will change
- Require explicit confirmation for large batches (>10 items)

**Draft States:**
- Save filter/selection state
- Resume where you left off (persist pagination)
- Don't lose work on accidental navigation

### 4. Feedback & Learning

**AI Score Explanation:**
- Click score to see reasoning
- Show which factors contributed (keywords matched, source credibility)
- Compare to historical decisions (similar signals)

**Reviewer Feedback:**
- Track approval accuracy (how often approvals stay published)
- Show patterns (what you tend to approve/reject)
- Suggest filters based on behavior

**Quality Metrics:**
- Review speed (signals per hour)
- Decision confidence (fewer reverses = higher confidence)
- Consensus (when multiple reviewers agree)

---

## Recommended UX Patterns for SecureLab

### Pattern 1: Triage Queue (Focused Mode)

**Layout:**
- Single signal at a time (full screen)
- Large preview area (title, summary, full content)
- Sidebar with metadata (category, source, scores)
- Fixed action bar at bottom (approve/reject/skip)

**Workflow:**
1. See one signal with full context
2. Press 'a' to approve (or click button)
3. Auto-advance to next signal
4. Undo available (toast with button)
5. Skip signals you're uncertain about
6. When done, review skipped queue

**Pros:**
- Maximum focus (no distractions)
- Fast for power users (keyboard-first)
- Minimal cognitive load
- Good for mobile (swipe left/right)

**Cons:**
- Can't compare multiple signals
- No overview of queue size
- Hard to spot patterns across signals

**Best For:**
- Daily triage of new signals
- High-volume moderation
- Mobile review

### Pattern 2: Kanban Board (Visual Status)

**Layout:**
- Columns: Pending → In Review → Approved / Rejected
- Cards can be dragged between columns
- Compact card view (title + key metadata)
- Expand card for details (modal or slide-out)

**Workflow:**
1. New signals appear in "Pending"
2. Drag to "In Review" when reading
3. Drag to "Approved" or "Rejected" when decided
4. Bulk actions via multi-select + drag
5. Save custom views (filters + sorts)

**Pros:**
- Visual overview of workflow state
- Natural drag-and-drop UX
- Easy to batch similar items
- Good for collaborative review (see what others are working on)

**Cons:**
- Requires more screen space
- Can feel overwhelming with many items
- Not ideal for keyboard-only users

**Best For:**
- Team collaboration
- Process-oriented workflows
- Weekly review sessions

### Pattern 3: Split View (List + Detail)

**Layout:**
- Left: Compact list of signals (title + score)
- Right: Full preview of selected signal
- Action buttons in right panel
- Keyboard shortcuts for navigation

**Workflow:**
1. Browse list with up/down arrows
2. Right panel shows selected signal details
3. Press 'a' or 'r' for approve/reject
4. List updates in real-time
5. Multi-select with shift+click for bulk

**Pros:**
- Best of both worlds (overview + detail)
- Familiar pattern (Gmail, Slack, Discord)
- Good keyboard support
- Easy to scan list quickly

**Cons:**
- Requires wider screen (not mobile-friendly)
- Can be cluttered on smaller displays

**Best For:**
- Desktop power users
- Medium-volume queues
- Balanced overview + detail needs

### Pattern 4: Table View (Data-Heavy)

**Layout:**
- Spreadsheet-like table
- Columns: Title, Category, Source, Score, Date, Actions
- Inline editing (click cell to edit)
- Sort by any column
- Freeze first column (always show title)

**Workflow:**
1. Sort by score (lowest first) or date (newest first)
2. Quickly scan titles
3. Click approve/reject in Actions column
4. Use checkboxes for bulk operations
5. Export to CSV for external analysis

**Pros:**
- Highest information density
- Powerful sorting/filtering
- Familiar to analysts
- Good for large datasets

**Cons:**
- Information overload
- Not great for reading content
- Feels "spreadsheet-y" (less modern)

**Best For:**
- Bulk review of many signals
- Data analysis mode
- Power users who want control

---

## Proposed Redesign: Hybrid Approach

### Primary Mode: Focused Triage (Pattern 1)

**When:** Daily review of new/pending signals  
**Who:** All reviewers (primary workflow)  

**Features:**
- Full-screen single signal view
- Keyboard shortcuts (a/r/s for approve/reject/skip)
- Auto-advance after decision
- Undo last 10 actions
- Progress indicator (X/Y signals reviewed today)
- Timer (gamification: how fast can you clear the queue?)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [←] Signal 12 of 45 pending                          [Skip] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🔴 CRITICAL                 AI Score: 82/100                │
│                                                               │
│  CVE-2026-12345: Critical RCE in Apache Tomcat              │
│                                                               │
│  A critical remote code execution vulnerability has been     │
│  discovered in Apache Tomcat versions 9.0.0 through         │
│  9.0.65. The vulnerability allows unauthenticated            │
│  attackers to execute arbitrary code by sending a            │
│  specially crafted HTTP request...                           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Category: vulnerability                              │   │
│  │ Source: The Hacker News (trust: 95%)                │   │
│  │ Published: 2026-02-23                                │   │
│  │ Tags: CVE, RCE, Apache                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Why AI scored this 82:                                      │
│  ✓ Contains CVE (high priority)                             │
│  ✓ Critical severity                                        │
│  ✓ Trusted source                                           │
│  ✓ Technical depth                                          │
│  ✗ No proof-of-concept linked                               │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ [A] Approve    [R] Reject    [S] Skip    [?] Help           │
└─────────────────────────────────────────────────────────────┘
```

### Secondary Mode: List View (Pattern 3)

**When:** Weekly bulk review, filtering by specific criteria  
**Who:** Power users, admins  

**Features:**
- Compact list (10-20 signals per page)
- Quick preview on hover (tooltip with summary)
- Inline approve/reject buttons
- Multi-select for bulk operations
- Advanced filters (date range, score range, source)
- Saved views ("My Pending", "High Priority", "This Week")

**Layout:**
```
┌───────────────────────────────────────────────────────────────────────┐
│ Filters: [Pending ▾] [All Categories ▾] [Last 7 days ▾]   [+ Save View] │
├───────────────────────────────────────────────────────────────────────┤
│ ☐  CVE-2026-12345: Critical RCE in Apache Tomcat                     │
│     🔴 Critical · vulnerability · Score: 82 · 2h ago  [✓] [✗]        │
├───────────────────────────────────────────────────────────────────────┤
│ ☐  New ransomware campaign targets healthcare orgs                   │
│     🟡 High · ransomware · Score: 75 · 5h ago        [✓] [✗]        │
├───────────────────────────────────────────────────────────────────────┤
│ ☐  GitHub releases security advisory for Actions                     │
│     🟢 Medium · advisory · Score: 68 · 1d ago        [✓] [✗]        │
└───────────────────────────────────────────────────────────────────────┘
```

### Tertiary Mode: Kanban Board (Pattern 2)

**When:** Team collaboration, workflow visibility  
**Who:** Managers, teams with multiple reviewers  

**Features:**
- Visual columns (Pending, In Review, Approved, Rejected)
- Drag-and-drop between states
- Assignment to reviewers
- Comments/discussion on signals
- Filters by assignee, category, date

---

## Implementation Roadmap

### Phase 1: Core Improvements (Week 1-2)

**Priority 1: Keyboard Shortcuts**
- Implement global keyboard listener
- j/k for prev/next
- a for approve, r for reject, s for skip
- ? to show help overlay
- esc to close modals

**Priority 2: Undo Functionality**
- Add undo stack (client-side state)
- Show toast with undo button after action
- API endpoint: `POST /api/v1/admin/signals/{id}/undo`
- 10-second grace period before toast disappears

**Priority 3: Auto-Advance**
- After approve/reject, automatically show next signal
- Maintain filter state
- Preload next signal for instant display

**Priority 4: AI Score Explanation**
- Click score badge to show tooltip/modal
- Display factors contributing to score
- Show matched keywords, source credibility, category confidence

### Phase 2: Focused Triage Mode (Week 3-4)

**New Page:** `/admin/intel/triage`

**Features:**
- Full-screen single signal view
- Large readable text
- Clear action buttons
- Progress indicator
- Skip queue (separate from reject)
- Session stats (signals reviewed, average time per signal)

**Components to Build:**
- `TriageView.tsx` - Main full-screen layout
- `SignalDetail.tsx` - Content display
- `TriageActions.tsx` - Action bar with keyboard hints
- `TriageProgress.tsx` - Progress indicator
- `SkipQueue.tsx` - Review skipped signals

### Phase 3: Enhanced List View (Week 5)

**Improvements to Existing `/admin/intel`:**
- Compact card design (50% height reduction)
- Inline approve/reject buttons (no modal for common actions)
- Hover preview (tooltip with full summary)
- Quick filters (chips above list: "High Priority", "Unread", "Last 24h")
- Saved views (user preferences)

**New Components:**
- `CompactSignalCard.tsx` - Smaller, scannable card
- `QuickFilters.tsx` - Filter chips
- `SavedViews.tsx` - Custom view management

### Phase 4: Analytics & Feedback (Week 6)

**New Page:** `/admin/intel/insights`

**Features:**
- Personal review stats (signals reviewed, acceptance rate)
- Category breakdown (what you approve most)
- Time spent reviewing (by day/week)
- AI accuracy (how often AI agrees with your decisions)
- Improvement suggestions (based on patterns)

**Components:**
- `ReviewStats.tsx` - Personal dashboard
- `CategoryInsights.tsx` - Category analysis
- `AccuracyMetrics.tsx` - AI vs human decisions

---

## Specific UX Improvements

### Improvement 1: Rejection Reasons Inline

**Current:** Modal pops up, interrupts flow  
**New:** Inline dropdown that appears on card  

```tsx
// When user clicks reject:
<div className="rejection-panel">
  <p>Why reject?</p>
  <select>
    <option>Product review</option>
    <option>Vendor marketing</option>
    <option>Not cybersecurity</option>
    ...
  </select>
  <button>Confirm Reject</button>
  <button>Cancel</button>
</div>
```

### Improvement 2: Smart Bulk Selection

**Current:** Manually click checkboxes  
**New:** Selection helpers  

```
[ ] Select all on page
[ ] Select all pending
[ ] Select all with score < 50
[ ] Select all from last 24h
```

### Improvement 3: Preview on Hover

**Current:** Must click into signal to see details  
**New:** Tooltip preview on title hover  

```tsx
<Tooltip content={<SignalPreview signal={signal} />}>
  <h3>{signal.title}</h3>
</Tooltip>
```

### Improvement 4: Confidence Indicators

**Current:** Just a score number  
**New:** Visual confidence + explanation  

```
AI Score: 82/100 ●●●●◐
Confidence: High

Factors:
✓ Contains CVE
✓ Critical severity  
✓ Trusted source (The Hacker News, 95% trust)
✓ Technical depth
✗ No PoC linked
```

### Improvement 5: Source Trust Display

**Current:** Source shown as plain text  
**New:** Trust badge with history  

```tsx
<SourceBadge 
  name="The Hacker News"
  trustScore={95}
  totalSignals={1234}
  approvalRate={87}
/>
```

### Improvement 6: Similar Signal Detection

**Current:** No duplicate detection visible  
**New:** Warning banner if similar signal exists  

```
⚠️ Similar signal found: "CVE-2026-12345: RCE in Apache"
   Status: Already approved · Published: 2d ago
   [View] [Mark as duplicate]
```

---

## Mobile Considerations

**Swipe Interface (iOS/Android):**
- Swipe right = approve
- Swipe left = reject
- Tap to read full content
- Double-tap to skip
- Shake to undo

**Touch-Optimized Buttons:**
- Larger tap targets (min 44x44px)
- Bottom-sheet for actions (easier thumb reach)
- Haptic feedback on actions
- Pull-to-refresh

---

## Accessibility

**Keyboard Navigation:**
- All actions keyboard-accessible
- Focus indicators on all interactive elements
- Skip links (skip to content, skip to actions)
- Screen reader announcements for state changes

**Visual Accessibility:**
- High contrast mode support
- Color-blind safe palette (not just color for severity)
- Text size adjustable
- Reduced motion mode (disable animations)

**Cognitive Accessibility:**
- Clear labels (no ambiguous icons)
- Consistent patterns
- Undo for mistakes
- Help documentation accessible via ?

---

## Success Metrics

**Speed:**
- Average time per signal (target: <30 seconds)
- Signals reviewed per session (target: >20)
- Keyboard shortcut adoption (target: >50% of power users)

**Accuracy:**
- Undo rate (target: <5%)
- Reversal rate (signals approved then rejected later) (target: <2%)
- AI agreement rate (target: >80%)

**User Satisfaction:**
- NPS score for reviewers
- Feature usage (triage mode vs list view)
- Feedback survey responses

---

## Next Steps

1. **User Research:** Interview Gromit and Muttley about their current workflow pain points
2. **Prototype:** Build Focused Triage Mode mockup in Figma
3. **Validate:** Test with real signals, gather feedback
4. **Implement Phase 1:** Keyboard shortcuts + undo + auto-advance
5. **Iterate:** Measure metrics, refine based on usage

---

## Questions to Answer

1. **Workflow Preference:** Does Gromit prefer focused mode (one at a time) or list view (many visible)?
2. **Rejection Reasons:** Are the current categories sufficient? Any missing?
3. **AI Trust:** How much weight does the AI score carry in decisions?
4. **Batch Operations:** How often are bulk approvals/rejects needed?
5. **Mobile Usage:** Will reviews happen on mobile/tablet, or desktop only?
6. **Collaboration:** Will multiple people review signals, or just Gromit?

---

**References:**
- [Nielsen Norman Group: Workflow Optimization](https://www.nngroup.com/articles/)
- [Basecamp's Job Queue Design](https://basecamp.com/shapeup)
- [GitHub's PR Review UX Evolution](https://github.blog)
- [Content Moderation at Scale (Facebook)](https://transparency.fb.com)
