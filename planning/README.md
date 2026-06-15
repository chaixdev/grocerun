# Planning

This directory contains work-in-progress, speculative exploration, and transient
artifacts that have not yet been promoted to canonical documentation.

## Directory Guide

### `tickets/`
Concrete work items: phase migration docs, user stories, product evolution spec,
design specifications, test design docs.

Items here should read like lightweight tickets:
- enough product context to explain why the work matters
- enough technical context to explain what part of the system is affected
- enough scope framing to make the work resumable later

They should **not** be overly opinionated about the solution space.
Detailed solution design belongs in `brainstorm/`.

**Key files:**
- `PROJECT-STATUS.md` — Current state, phase progress, next steps
- `user-stories/` — User stories tracked with implementation status (✅ ⚠️ 🔲)

### `brainstorm/`
Speculative solution exploration. Proposals, designs, and investigations that
are not yet committed as work items.

Use ISO datetime prefix naming: `YYYY-MM-DDTHHMM_topic-slug.md`

### `reviews/`
Code review output from the `grocerun-deep-reviewer`. Named by date and branch.

### `archive/`
Historical plans, investigations, and summaries that are no longer canonical but
remain useful as project context. Archived documents should not be used as
current implementation guidance without checking `wiki/`, `apps/*/README.md`,
and `planning/tickets/PROJECT-STATUS.md` first.

## Relationship to `wiki/`

`planning/` is work-in-progress. `wiki/` is canonical truth.

Promotion path:
```
planning/brainstorm/  →  planning/tickets/  →  wiki/adr|technical-design|rules/
```

Once a ticket is implemented and the solution is accepted:
- Architectural decisions → `wiki/adr/`
- Feature-level technical mechanics → `wiki/technical-design/`
- Contributor guidance and conventions → `wiki/rules/`

## Naming Conventions

- **Brainstorm docs**: `YYYY-MM-DDTHHMM_topic-slug.md` (ISO datetime prefix)
- **Tickets**: Descriptive slug or phase name (e.g., `PHASE-5-SIMPLIFICATION.md`)
- **Reviews**: `YYYY-MM-DD_review_branch-name.md`
- **Archives**: Grouped by topic and date, e.g. `archive/e2e-testing-2026-01/`

## Template

Use `TEMPLATE.md` as the starting point for new planning items.
