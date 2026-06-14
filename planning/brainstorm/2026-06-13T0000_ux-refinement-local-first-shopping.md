# UX Refinement For Local-First Shopping

**Status:** NOT STARTED

## Summary

Refine the user experience for Grocerun's local-first shopping journey before implementing piecemeal UX surfacing for sync, offline, locking, duplicate, and completed-trip gaps. The goal is to define a coherent mobile-first interaction model for household planning and shopping that matches the actual architecture and user needs.

## Problem

The codebase audit identified multiple UX-facing gaps: optimistic local writes can later be rejected, offline support is partial, shopping mode uses a lock, completed trips do not clearly distinguish planned versus purchased quantity, and terminology is inconsistent. These should not be solved with scattered toasts, banners, or copy changes. They need a refinement pass that defines how the product should communicate state across the full shopping journey.

## Product Context

- Grocerun is a household grocery app, so users need confidence that shared lists are current, edits are saved, and shopping progress is reliable.
- Mobile-first shopping means the UI must be fast, glanceable, and not noisy during a trip.
- Offline/local-first behavior is valuable only if users understand what is available offline and what is still syncing.
- Household collaboration needs a clear mental model: who can edit, who can watch, what happens when someone else is shopping, and how conflicts resolve.
- Completed trips are history; showing planned values where purchased values matter can undermine trust.

## Technical Context

Relevant current architecture:

- RxDB locally stores six collections: `households`, `stores`, `sections`, `items`, `lists`, `listItems`.
- Only `items` and `listItems` push local-first changes.
- `households`, `stores`, `sections`, and `lists` are server-authoritative and mutate via REST.
- List lifecycle operations are currently REST-only: create, start shopping, cancel shopping, complete.
- Shopping mode is lock-based: only `assignedTo` can mutate a `SHOPPING` list; others can observe.
- Sync uses SSE and pull replication for convergence.

Relevant files and areas:

- `apps/web/src/features/lists/components/ListEditor.tsx`
- `apps/web/src/features/lists/components/ListItemRow.tsx`
- `apps/web/src/features/lists/components/TripSummary.tsx`
- `apps/web/src/features/lists/hooks/useAddItem.ts`
- `apps/web/src/features/lists/hooks/useLists.ts`
- `apps/web/src/features/lists/hooks/useListQueries.ts`
- `apps/web/src/core/lib/useRxMutation.ts`
- `apps/web/src/core/rxdb/database.ts`
- `apps/server/src/shared/shopping-lock.ts`
- `apps/server/src/lists/lists.service.ts`

Audit source:

- `planning/reviews/2026-06-13_whole-codebase-domain-simplicity-audit.md`

## Scope

This refinement should cover the end-to-end household shopping journey:

- Create or open a household/store shopping list.
- Plan items and quantities.
- Add new catalog items and choose sections.
- Start shopping mode.
- Shop with local-first item edits.
- Handle offline, reconnecting, pending, rejected, and conflict states.
- Handle another household member watching or attempting to edit a locked list.
- Finish shopping and confirm trip summary.
- Review completed list/history quantities.

Specific UX tasks to refine:

- Define user-facing states for local-first writes: local pending, synced, rejected, offline queued, locked by another shopper, and sync recovering.
- Decide whether list lifecycle operations are promised offline or explicitly online-only.
- Define how shopping lock state should be communicated to the lock holder and observers.
- Define duplicate add-item behavior for double taps, local duplicates, and concurrent household edits.
- Define quantity behavior in planning, shopping, and completed modes.
- Define completed-trip display: planned quantity, purchased quantity, missing items, and completion timing.
- Define terminology for list, trip, run, planning, shopping, completed, active, and archived/history.
- Define how much sync status should be visible during normal mobile shopping without creating noise.

## Out of Scope

- Implementing the UI changes directly.
- Reworking backend sync contracts or aggregate invariants.
- Designing multi-writer shopping if observer-only shopping remains the product decision.
- Building a generalized notification/toast framework.
- Visual redesign unrelated to the shopping journey.
- Desktop-first navigation redesign.

## Known Constraints / Prior Findings

- Local-first writes are currently limited to `items` and `listItems`; list lifecycle is REST-only.
- Optimistic local writes currently report local success before server acceptance is surfaced.
- Quantity edits are debounced and can race with trip completion if not flushed.
- Non-lock-holders can observe a shopping list but cannot mutate it.
- Section, store, household, and list mutations use REST and then rely on resync.
- Existing docs conflict on local-first scope and shopping collaboration semantics.
- Mobile constraints matter: offline, battery, wake lock, small-screen density, and reduced tolerance for noisy status UI.

## UX Refinement Tracks

### 1. Local-First Write Feedback

Questions:

- What should users see immediately after checking an item, changing quantity, or adding an item?
- Should every write expose sync state, or only exceptions?
- How should rejected writes appear without making the app feel unreliable?
- What should happen when a pending local edit is later rejected because the list is locked or completed?

Output:

- A state model for local item/list-item writes.
- Interaction guidance for pending, accepted, rejected, and offline-queued states.
- Copy guidance for conflict or rejection states.

### 2. Offline Boundary

Questions:

- Should users be able to start shopping while offline?
- Should users be able to complete a trip while offline?
- If completion is online-only, when and how should the UI block it?
- What should the app promise when offline: view-only, item editing, full trip flow, or queued completion?

Output:

- A clear online/offline capability matrix.
- UX rules for blocking or queuing lifecycle actions.
- Copy for offline limitations and reconnecting states.

### 3. Shopping Lock And Household Collaboration

Questions:

- Is shopping mode intentionally single-writer/observer-only?
- How should observers understand they are watching live but cannot edit?
- Should observers keep wake lock enabled?
- How should a user recover if the lock holder abandons a trip?

Output:

- Canonical lock-state UX for lock holder and observers.
- Copy and affordance rules for locked lists.
- Follow-up product questions for lock takeover or timeout, if needed.

### 4. Add Item And Duplicate Resolution

Questions:

- What happens on rapid double-tap add?
- What happens if another household member adds the same item concurrently?
- Should duplicate items be merged silently, highlighted, or explained?
- How should the app distinguish catalog duplicates from list duplicates?

Output:

- User-facing duplicate behavior rules.
- Interaction guidance for local duplicate reconciliation.
- Copy for “already in list”, “merged”, or “sync corrected duplicate” states.

### 5. Quantity And Trip Completion

Questions:

- In shopping mode, does editing quantity mean “purchased quantity” and implicitly checked?
- Before completion, must pending quantity edits be flushed and confirmed?
- In completed history, should the row show planned, purchased, or both?
- How should missing or partially purchased items appear in the summary?

Output:

- Quantity semantics by mode.
- Rules for completion readiness and pending-edit flushing.
- Completed-trip display model.

### 6. Terminology And Information Architecture

Questions:

- Is the primary object a “shopping list”, “trip”, “run”, or something else?
- What are canonical labels for planning, shopping, completed, active, and history?
- Should “completed” be user-facing, or should it be “trip history”?
- How should dashboard cards and list detail use the same vocabulary?

Output:

- Canonical vocabulary table.
- Route/card/detail copy recommendations.
- Terms to avoid.

## Open Questions

- Is observer-only shopping a final product decision, or a temporary implementation constraint?
- Is offline trip completion a product requirement for v1, or is offline item editing enough?
- Should a household have exactly one active list per store, or can multiple active lists exist intentionally?
- Should completed trips become a durable history feature with explicit `startedAt` and `completedAt`?
- What level of sync status is acceptable before it becomes noise during shopping?
- Should local-first rejection be rare enough to show as an exception, or common enough to require persistent per-row state?

## Success Criteria

- The product has a clear state model for local-first item/list-item writes.
- Offline capabilities and online-only boundaries are explicit.
- Shopping lock behavior is understandable to both lock holder and observers.
- Duplicate and conflict behavior is defined before engineering implements reconciliation surfacing.
- Quantity semantics are consistent across planning, shopping, summary, and history.
- Canonical terminology is defined for the list lifecycle.
- The refinement produces implementation-ready UX tickets, not just notes.

## Candidate Follow-Up Tickets

- Local-first write feedback and rejection surfacing.
- Offline lifecycle boundary UX.
- Shopping lock observer experience.
- Add-item duplicate reconciliation UX.
- Trip completion pending-write and quantity semantics.
- Completed trip history display.
- Shopping lifecycle terminology pass.

## Links

- `planning/reviews/2026-06-13_whole-codebase-domain-simplicity-audit.md`
- `planning/tickets/user-stories/US-09-shopping-lifecycle.md`
- `wiki/architecture/domain-model.md`
- `wiki/adr/007-phase4-local-first-strategy.md`
