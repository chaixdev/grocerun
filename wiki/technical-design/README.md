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

_None yet. Extract stable technical designs from implemented features as they
become worth preserving._

Initial candidates:

- shopping list state machine and trip-completion flow
- shopping lock acquisition, enforcement, and release sequence
- RxDB push/pull replication and SSE-triggered resync flow
- mobile auth restoration token-cache fallback
- household invitation token lifecycle
