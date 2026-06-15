---
name: grocerun-implementation-notes
description: Use during Grocerun implementation to keep planning tickets updated with deviations, gotchas, rationale, tests, and follow-ups.
---

# Grocerun Implementation Notes

Use this skill while coding from a planning ticket.

## Update the ticket as work proceeds

Maintain these sections in the planning ticket:

- `Implementation Notes` — what was actually built.
- `Deviations from Plan` — plan changes and why.
- `Gotchas / Rationale` — surprising behavior, constraints, trade-offs.
- `Test Notes` — tests added, updated, skipped, or deferred with reason.
- `Follow-Ups` — explicit future work with status.

## Required implementation awareness

Before significant code changes, review:

- `planning/tickets/PROJECT-STATUS.md`
- the ticket/brainstorm source
- relevant ADRs in `wiki/adr/`
- `wiki/rules/coding-standards.md`
- relevant patterns in `wiki/patterns/`
- e2e journey semantics when user flow changes

## Rules

- Do not let implementation drift silently from the ticket.
- If a shortcut is taken, record it as a conscious deviation.
- If a finding should become a rule/pattern/ADR, mark it for documentation extraction.
