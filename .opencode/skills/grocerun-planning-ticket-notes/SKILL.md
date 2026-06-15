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
