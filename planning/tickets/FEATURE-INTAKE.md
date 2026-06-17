# Feature Intake

Central capture point for raw Grocerun ideas before they are brainstormed,
planned, rejected, or promoted to implementation.

This file is intentionally lightweight. It prevents useful ideas from being
lost in chat history without forcing premature planning.

## Status Values

- `captured` — logged, not yet triaged
- `needs-brainstorm` — ambiguous or multi-directional
- `promoted` — has a planning ticket or user story
- `parked` — valid but not timely
- `rejected` — intentionally not pursuing

## Intake Template

```markdown
### YYYY-MM-DD — Short title

- **Status:** captured | needs-brainstorm | promoted | parked | rejected
- **Category:** feature | bug | UX | architecture | test | process
- **Raw request:** ...
- **Context / notes:** ...
- **Links:** brainstorm/ticket/review/ADR links as they emerge
```

## Epic Breakdown

| # | Epic | Items | Description |
|---|------|-------|-------------|
| 1 | Trust & Onboarding | #1, #4, #7, #19 | Error resilience, confirmation dialogs, sync visibility, guided setup — building user confidence from first open through everyday use |
| 2 | Store Experience | #2, #3, #11 | Store cards, config, and per-store item ordering — store as a first-class entity |
| 3 | Household Collaboration | #5, #6, #8, #14, #15 | Member management, activity feeds, real-time awareness — shared households that feel shared |
| 4 | Item Catalog & Discovery | #9, #10, #13, #18, #20, #21, #23 | Canonical item catalog, staples, barcodes, fuzzy search — fast and reliable item creation |
| 5 | Shopping Flow | #12, #16, #17, #22 | List creation, bulk actions, in-trip adjustments — the core trip experience |
| 6 | Trip History & Insights | #24, #25, #26, #27, #28, #29 | Price tracking, trip review, calendar, receipt OCR — post-trip enrichment and spending visibility |

## Entries

### 2026-06-15 — Show "clean local db and resync" in error boxes

- **Status:** captured
- **Category:** UX
- **Raw request:** When an error occurs (e.g. DB conflict, stale cached frontend data mismatch causing DB load failure), the error box should also display the "clean local db and resync" button that already exists on the settings page — giving the user a quick path to potential resolution instead of having to navigate to settings manually.
- **Context / notes:** The button already exists on the settings page; this is about surfacing it in error states. Relevant areas: error handling in RxDB/local-db interactions, the global error display component.
- **Links:** —

### 2026-06-15 — Stores page: primary card tap should go to store details, not list nav

- **Status:** captured
- **Category:** UX
- **Raw request:** The stores page has a big "navigate to list" button, plus "view store details" and "store configuration" buttons. The most prominent UI element (the store card itself) should go to store details/configuration, not navigate away to lists.
- **Context / notes:** Current layout has three CTAs competing on the store card. Primary action should be details/config.
- **Links:** —

### 2026-06-15 — Consolidate store detail and configuration into one page

- **Status:** captured
- **Category:** UX
- **Raw request:** "View store details" and "store configuration" buttons kind of do the same thing. Consolidate into a single page that covers both.
- **Context / notes:** Reduces cognitive load — one store page with inline editing rather than two separate views.
- **Links:** —

### 2026-06-15 — Confirm dialog for destructive store/household deletion

- **Status:** captured
- **Category:** UX
- **Raw request:** Deleting a store goes through even if there's an associated shopping list. Not asking to reject the deletion, but there should be a confirm dialog warning about the impact. Same applies for household deletion (higher in hierarchy).
- **Context / notes:** Destructive action with cascading effects — list items tied to deleted store, etc. Confirmation should surface what will be affected.
- **Links:** —

### 2026-06-15 — Allow leaving own household

- **Status:** captured
- **Category:** UX
- **Raw request:** Currently doesn't look like you can leave your "own" household via an explicit delete action with confirmation dialog. 
- **Context / notes:** Two paths: (1) not owner → leave; (2) owner → if other members exist, disallow (revisit with #9); if only member, delete household. "Only member and not owner" is invariant — cannot occur.
- **Links:** —

### 2026-06-15 — Household member management (list, remove, transfer ownership)

- **Status:** captured
- **Category:** UX
- **Raw request:** Expand household features: display member list, owner can remove members, transfer ownership (but must be accepted by target with a notification on app open), stay as member after ownership transfer.
- **Context / notes:** Ownership transfer is a two-step flow: offer → accept. Needs notification mechanism.
- **Links:** —

### 2026-06-15 — Sync status UX: offline/online visual feedback and stale data communication

- **Status:** captured
- **Category:** UX
- **Raw request:** Improve sync status UX: visual feedback for offline vs online mode, clear communication when data may be stale.
- **Context / notes:** Currently in Phase 4 with RxDB local-first — ideal timing for this. Should cover: connectivity indicator, last-synced timestamp, stale data warnings.
- **Links:** —

### 2026-06-15 — Non-shopping household members adding items to active shopping list

- **Status:** captured
- **Category:** UX
- **Raw request:** A household member who is not actively shopping should be able to add items to a list that is in "shopping mode." High-value functionality, but UX and technical approach need refinement.
- **Context / notes:** Requires real-time sync or optimistic updates with conflict resolution. The "shopping mode" state machine needs to support concurrent modifications from different users.
- **Links:** —

### 2026-06-15 — Per-household item catalog for multi-store shopping

- **Status:** captured
- **Category:** UX
- **Raw request:** Revise the "item" abstraction for better maintainability — e.g. have an item catalog per household. This could support items being bought from multiple stores and unlock features like "do you want to add items X, Y, Z from store 2's shopping list to your current trip?" when entering shopping mode for store 1.
- **Context / notes:** Touches core data model (items, stores, households). Likely requires an ADR before implementation. The multi-store prompt is a smart UX touch.
- **Links:** —

### 2026-06-15 — Shopping list items: free-text comment and photo field

- **Status:** captured
- **Category:** UX
- **Raw request:** Shopping list items should accept a free-text comment field and a photo field. This helps narrow down for the shopper what to buy when multiple options are available. E.g. free text: "gluten free, no sugars, no additives" or "avoid brand X, bad experience." A photo could pinpoint the exact product.
- **Context / notes:** Comment field is straightforward (text column on items). Photo adds complexity: storage (local vs cloud), sync, offline support. Could start with text-only and add photos later.
- **Links:** —

### 2026-06-16 — Per-household tree-based item ordering with auto-sort on add

- **Status:** captured
- **Category:** UX
- **Raw request:** We already have aisle/section ordering in store configuration. Extend this with a per-household tree-like ordering structure so new items can be inserted into the order, ordering can be updated, and adding known items to a list auto-sorts them into their section buckets — similar to how known items already group into sections today, but with a globally maintained order.
- **Context / notes:** Ordering is per-store, not per-household — items are ordered differently in Store A vs Store B, which aligns with how store layouts differ. This becomes transparent once the per-household item catalog (#9 above) is in place, since items span stores but their position depends on which store you're shopping. Tree structure (sections → aisles → items) maps naturally to store layout. Auto-sort on add is the killer feature here.
- **Links:** —

### 2026-06-16 — Prompt to create new list from unchecked items on shopping mode completion

- **Status:** captured
- **Category:** UX
- **Raw request:** When completing shopping mode, ask: "do you want to create a new list from the unchecked items?" Leftovers become the starting point for the next trip — avoids the annoyance of re-adding the items you didn't find or couldn't buy.
- **Context / notes:** Simple flow: complete trip → detect N unchecked items → prompt with count → create new list + move unchecked items. Edge case: what if the user already has a list for that store? Append vs replace decision.
- **Links:** —

### 2026-06-16 — Barcode scanning to add items

- **Status:** captured
- **Category:** UX
- **Raw request:** Scan product barcodes to add items to a shopping list. Wild idea — exploring feasibility. The Barcode Detection API (shape detection) is shipping in Chrome/Edge and works in PWAs.
- **Context / notes:** Barcodes are product-level (not store-level), making them a perfect universal key for the household item catalog (#9 above). Two-phase approach: (1) local catalog only — first scan requires typing item name, subsequent scans auto-resolve via stored mapping; (2) optionally integrate Open Food Facts (free, no API key) for first-scan resolution + product images. Aligns with local-first — catalog entries cached after first lookup. Weight-variable items (deli, produce) are out of scope — those barcodes are store-specific. Strong synergy with #9 and #11: barcode binds the catalog entry, per-store ordering determines where it appears in each store's list.
- **Links:** —

### 2026-06-16 — Household activity feed

- **Status:** captured
- **Category:** UX
- **Raw request:** A shared household activity feed — "Chaitanya added 3 items", "Priya completed milk". Gives situational awareness without needing a chat feature.
- **Context / notes:** Depends on having per-household event data. Lightweight alternative to real-time collaboration features. Could be pull-based (refresh to see updates) rather than push, to keep complexity low.
- **Links:** —

### 2026-06-16 — Push notifications for household events

- **Status:** captured
- **Category:** UX
- **Raw request:** Push notifications for relevant household events: items added to your active list, ownership transfer request received. Pairs with #6 (household member management) and #8 (non-shopping member additions).
- **Context / notes:** Requires service worker push support in the PWA + backend notification infrastructure. Significant scope — catalog this as dependent on household features maturing.
- **Links:** —

### 2026-06-16 — Quick-add from trip history ("buy again")

- **Status:** captured
- **Category:** UX
- **Raw request:** A "buy again" feature — quick-add items from your last completed trip for a given store. Low implementation cost, high daily value.
- **Context / notes:** Could surface as a one-tap section at the top of a new list: "Add all 12 items from your last BigBasket trip." Or per-item from a history view.
- **Links:** —

### 2026-06-16 — Bulk actions on shopping list items

- **Status:** captured
- **Category:** UX
- **Raw request:** Bulk actions on the shopping list: mark all done, clear completed, move selected items to another list.
- **Context / notes:** Standard list UX patterns. Selection mode + action bar. "Clear completed" already partially exists when completing shopping mode (all checked items are done); this is for mid-trip cleanup.
- **Links:** —

### 2026-06-16 — Recurring items / staples list

- **Status:** captured
- **Category:** UX
- **Raw request:** Flag items as recurring / staples — milk, bread, eggs type stuff — so they auto-appear on the next list for that store. Could be conceptualized as a per-store "staples" list that gets merged into new lists.
- **Context / notes:** Schema question: is a "staples" list a special list type, or just an attribute on catalog items? The latter is simpler — a `recurring` boolean on the item-catalog entry. Merging into new lists: pre-populate or prompt? Pre-populate with opt-out per item feels cleaner. Related legacy: GRO-23 "Pantry Items" (`isPantry` boolean, `togglePantry()` action) was backlogged in the old wiki and never implemented — same concept under an older name.
- **Links:** [GRO-23](../apps/web/wiki-legacy/planning/tickets/backlog/GRO-23-pantry-items.md), [US-2 My Usuals](../planning/tickets/user-stories/US-02-common-items.md)

### 2026-06-16 — Pantry check: pre-trip review of staples

- **Status:** captured
- **Category:** UX
- **Raw request:** Before heading to the store, the user opens a "pantry check" mode: a checklist of pantry/staples items to quickly tick off what's needed. Distinct from auto-populating new lists (#18) — this is an active, dedicated pre-trip review flow.
- **Context / notes:** Complements #18 (recurring items) — #18 defines what's recurring, pantry check is the interaction mode. Flow: user taps "pantry check" → sees all staples sorted by store section → ticks what's needed → creates a list from the checked items. Same data (recurring/staples items), different UX surface.
- **Links:** —

### 2026-06-16 — Guided setup wizard for new users

- **Status:** captured
- **Category:** UX
- **Raw request:** A guided setup wizard for first-time users: create household → add first store → create first list. Reduces drop-off from empty-state confusion.
- **Context / notes:** Likely 2-3 steps with simple forms. Should be skippable. Would pair well with a "demo" or sample data fallback for users who want to explore before committing.
- **Links:** —

### 2026-06-16 — Fuzzy matching for item search (typo-tolerant)

- **Status:** captured
- **Category:** UX
- **Raw request:** Typo-tolerant item search — users misspelling items shouldn't get zero results. From legacy GRO-14, which proposed SQLite FTS5 + spellfix1. The approach may differ now that we're local-first with RxDB.
- **Context / notes:** Legacy GRO-14 was designed for Prisma/SQLite FTS5. With RxDB, the implementation path changes — likely RxDB text indexes or a client-side fuzzy matching library (Fuse.js, etc.). This is table-stakes for a shopping app — users type fast on mobile.
- **Links:** [GRO-14](../apps/web/wiki-legacy/planning/tickets/backlog/GRO-14-fuzzy-matching.md)

### 2026-06-16 — In-trip section reassignment

- **Status:** captured
- **Category:** UX
- **Raw request:** During an active shopping trip, allow moving an item from one section to another. E.g. you realize the item is in the wrong aisle while shopping, or the store layout changed. From legacy GRO-22.
- **Context / notes:** Legacy GRO-22 was deferred for US-4. Would require inline section picker per item during shopping mode. Edge case: what if the target section doesn't exist yet? Allow creating a section on the fly? Could piggyback on the section management UI (GRO-45, already implemented).
- **Links:** [GRO-22](../apps/web/wiki-legacy/planning/tickets/backlog/GRO-22-in-trip-reassignment.md)

### 2026-06-16 — Filter modes for list creation (by frequency / favorites)

- **Status:** captured
- **Category:** UX
- **Raw request:** When creating a new shopping list, offer filter/sort modes (by purchase frequency, by favorites) to help users quickly select items. From legacy GRO-24.
- **Context / notes:** Distinct from #16 (quick-add from history / "buy again"), which is a passive one-tap clone of the last trip. Filter modes are for the interactive list creation flow — browsing and selecting from a larger pool of known items. Complements #18 (staples) by giving users a discoverable way to find items they've bought before but aren't necessarily recurring. Purchase count tracking (#9 item catalog) is a prerequisite.
- **Links:** [GRO-24](../apps/web/wiki-legacy/planning/tickets/backlog/GRO-24-filter-modes.md), #16, #18

### 2026-06-16 — Various rejected intake: dialog glitch, email/password auth, archived accordion

- **Status:** rejected
- **Category:** UX
- **Raw request:** Three legacy items dismissed during intake review:
  - **GRO-25 "New Item" dialog glitch** — race condition in item creation dialog; no longer observed.
  - **GRO-IAM alternative auth** — email/password or generic OIDC; rejected, Google-only is sufficient.
  - **GRO-39 archived lists accordion** — collapsible history on dashboard; not useful.
- **Context / notes:** Logged here for traceability so these don't resurface as "missed" features.
- **Links:** —

### 2026-06-16 — Horizon: receipt photo → OCR → item matching + price tracking

- **Status:** captured
- **Category:** UX
- **Raw request:** Take a photo of the receipt after shopping, attach to the trip. Background OCR processes it, matches receipt lines to shopping list items, creates new items for unrecognized lines, and tracks prices. Long-horizon idea — the OCR pipeline is the hard part; the enabling features are valuable standalone.
- **Context / notes:** Enabling pieces (valuable independently): manual price entry, trip detail view, media capture, trip completion enrichment. OCR approach options: browser-based (Tesseract.js, PWA-friendly but heavy) or server-side (NestJS background job). GDPR consideration: receipt data contains store location, timestamp, payment info — data stays within user's household scope. See enabling entries below.
- **Links:** —

### 2026-06-16 — Manual price entry on list items during shopping

- **Status:** captured
- **Category:** UX
- **Raw request:** Tap to enter a price as you tick items off during shopping mode. Gives per-trip spend without any OCR. Foundation for all price/spending features.
- **Context / notes:** Schema: nullable `price` field on `ListItem`. UX: inline number input (compact, currency symbol). Can start with whole-number entry and add decimal later. Privacy-first: only the user entering prices sees them. This is step 1 of the receipt roadmap.
- **Links:** —

### 2026-06-16 — Trip detail / history view

- **Status:** captured
- **Category:** UX
- **Raw request:** A trip detail page for completed shopping trips: items bought (with prices if available), items skipped, total spend, trip duration, store name, date. GRO-48 (trip summary) was never built and the current UX has no way to review past trips.
- **Context / notes:** Standalone value: review what happened, re-add skipped items (#12), see spending trends. Also the natural home for receipt photos (#24). Complements the calendar view (#29). GRO-48 provides a starting point for the completion flow but the detail view needs designing from scratch.
- **Links:** [GRO-48](../apps/web/wiki-legacy/planning/tickets/backlog/GRO-48-trip-summary.md), #12

### 2026-06-16 — Trip completion: prompt to add items bought off-list

- **Status:** captured
- **Category:** UX
- **Raw request:** On completing a shopping trip, prompt "add anything you bought that wasn't on your list?" These get attached to the trip and optionally added to the household item catalog. The manual version of receipt OCR line-matching — same outcome, human input instead of machine.
- **Context / notes:** Standalone value: the item catalog grows organically from real purchase behavior. Combined with trip detail (#26), users can edit the trip record post-completion. Combined with price entry (#25), off-list items can have prices too.
- **Links:** —

### 2026-06-16 — Media capture capability (PWA camera + photo picker)

- **Status:** captured
- **Category:** UX
- **Raw request:** Shared infrastructure for capturing photos within the PWA: camera access via `getUserMedia` and photo library picker. Unlocks item photos (#10) and receipt scanning (#24). One-time plumbing, multiple features benefit.
- **Context / notes:** PWA constraints: HTTPS required for `getUserMedia`, needs permission handling. Storage: local RxDB attachments? Or separate local file store? Sync implications for photos — likely async upload vs inline sync. Could start with photo picker only (simpler, still useful) and add live camera later.
- **Links:** #10, #24

### 2026-06-16 — Calendar view of shopping history

- **Status:** captured
- **Category:** UX
- **Raw request:** A calendar view showing when shopping trips happened — dots or markers on dates, tap to see trip summary. Natural companion to the trip detail view.
- **Context / notes:** Low implementation cost if trip history exists — just a calendar renderer with aggregated trip dates. Could show trip count per day, total spend per day (if price tracking exists). Complements filter modes (#23) by giving a time-based lens on shopping patterns.
- **Links:** #26

### 2026-06-17 — Cross-section drag-and-drop for item reassignment

- **Status:** captured
- **Category:** UX
- **Raw request:** Drag an item from one section to another within the same store to reassign it. Currently section reassignment requires editing the item's properties — DnD would make this a single gesture. Emerged during #7 (item ordering) design discussion — section-ordered lists make section boundaries visually obvious, and dragging an item across a boundary to change its section is a natural UX.
- **Context / notes:** Builds on #7's DnD infrastructure and ordered list display. Requires distinction between same-section reorder (update `Item.order`) and cross-section move (update `Item.sectionId` + `Item.order`). Edge case: where does the item land in the target section? At drop position or at end?
- **Links:** #7
