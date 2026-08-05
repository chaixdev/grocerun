---
name: grocerun-planning-ticket-notes
description: Use when creating or updating Grocerun planning tickets with scope, acceptance criteria, ADR/rule context, implementation notes, and test strategy.
---

# Grocerun Planning Ticket Notes

Use this skill to create or maintain implementation-ready planning tickets under
`planning/tickets/`.

## Required ticket sections

```markdown
# Ticket: Title

**Status:** planned | in-progress | blocked | review | uat | accepted | deferred
**Source:** intake/brainstorm/user-story links
**Branch:** branch name once started

## Background

## User-Facing Goal

## Acceptance Criteria

## Scope

## Non-Scope

## Relevant Context
- ADRs
- coding rules
- technical designs
- project status constraints

## Affected Areas

For each affected area, note its **behavioral criticality** — not just file size
or complexity, but how many runtime paths depend on it. A 50-line component that
handles session restoration, OIDC gate, and user identity derivation is far more
critical than a 200-line route file that only swaps a guard function name.

| Area | Change | Behavioral Criticality |
|------|--------|----------------------|
| `auth/guard.ts` | Rename function | Low — trivial rename |
| `__root.tsx` | Replace auth hook | High — owns session restoration, gate, identity |

## Preserved Behaviors

Before refactoring any module, catalog the resilience patterns, fallback paths,
and edge-case handling that already exist and must survive the change. Ask:
"when does this code fire?" and "what scenario does it handle that would break
if I removed it?" Record each as a preservation requirement:

- [ ] Cache fallback during session restoration window
- [ ] Redirect-loop prevention on fresh login
- [ ] Test-mode token bypass transparency
- [ ] Logout clears all state (cache, RxDB, SSE)

This section is **mandatory** for any ticket that touches session, auth, sync,
routing, or data persistence — modules where behavioral complexity is
concentrated in a few critical files. For surface-level UI changes, it can be
omitted.

## Implementation Outline

## Test Strategy
- unit
- server integration
- web component
- e2e journey semantics
- manual/UAT

## Documentation Impact Guess

## Risks / Open Questions

## Implementation Notes

## Deviations from Plan

## Gotchas / Rationale

## Follow-Ups
```

## Rules

- The planning ticket is a living document; update it during implementation.
- Record deviations and gotchas when they happen, not only at the end.
- Include relevant ADR/rule/technical-design context before implementation begins.
- Include why tests are or are not needed at each level.
