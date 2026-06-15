# Technical Design

Technical design documents explain the noteworthy implementation mechanics behind
accepted Grocerun features.

Use this folder for durable technical detail that is too focused for
`wiki/architecture/`, too procedural for `wiki/development/`, and too concrete to
remain in `planning/`.

## What Belongs Here

Good candidates include:

- state machines and lifecycle rules
- method call sequences and request/response flows
- layer boundaries and dependency direction
- OOP models, design patterns, and reusable implementation structures
- concurrency protocols, locking rules, and conflict handling mechanics
- synchronization, caching, and persistence mechanics
- feature-specific technical deep dives after implementation is accepted

## What Does Not Belong Here

| Content | Better location |
|---|---|
| System-wide context and major component views | `wiki/architecture/` |
| Why an architectural choice was made | `wiki/adr/` |
| Contributor rules and coding conventions | `wiki/rules/` |
| Developer workflows and operational procedures | `wiki/development/` |
| User-facing app or deployment guides | `wiki/user-guide/` |
| Speculative designs or in-flight implementation notes | `planning/` |

## Document Shape

Prefer one document per technical feature or mechanism. Use this outline when it
fits:

```markdown
# Feature or Mechanism Name

## Purpose

## Scope and Non-Goals

## State Model

## Call Sequence

## Layer Boundaries

## Key Types and Objects

## Failure Modes

## Tests and Verification Hooks

## Related Docs
```

Not every document needs every section. Include only sections that clarify the
mechanism.

## Current Documents

| Document | Topic |
|---|---|
| [`shopping-list-state-machine.md`](./shopping-list-state-machine.md) | PLANNING → SHOPPING → COMPLETED lifecycle, transition guards, and the one-active-list-per-store invariant |
| [`shopping-mode-lock.md`](./shopping-mode-lock.md) | Lock acquisition, enforcement, and release during SHOPPING mode |
| [`rxdb-sync-protocol.md`](./rxdb-sync-protocol.md) | RxDB push/pull replication, checkpoint pagination, conflict detection, SSE + polling fallback |
| [`soft-delete-cascade.md`](./soft-delete-cascade.md) | Soft-delete pattern, cascade deletion order, and restore-on-create convergence |
| [`dto-api-validation.md`](./dto-api-validation.md) | Zod-based DTO validation pipeline from shared schemas through `ZodValidationPipe` to controllers |
| [`household-invitation-lifecycle.md`](./household-invitation-lifecycle.md) | Invitation token lifecycle, status state machine, and lazy expiry |
| [`sse-resync-broadcast.md`](./sse-resync-broadcast.md) | In-memory SSE broadcast service, connection lifecycle, and event types |
| [`auth-restoration.md`](./auth-restoration.md) | Mobile session restoration, localStorage token-cache fallback, and logout guard |
| [`offline-persistence.md`](./offline-persistence.md) | RxDB/Dexie IndexedDB storage, offline write queuing, connectivity recovery, and diagnostic events |

Additional candidates:

- service layer architecture and dependency direction
