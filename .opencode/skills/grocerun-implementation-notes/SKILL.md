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
- relevant technical designs in `wiki/technical-design/`
- e2e journey semantics when user flow changes

## Rules

- Do not let implementation drift silently from the ticket.
- If a shortcut is taken, record it as a conscious deviation.
- If a finding should become a rule/technical-design/ADR, mark it for documentation extraction.

## Pre-Deletion Checklist

Before removing any code that handles error paths, fallbacks, teardown,
initialization, or session state, verify:

1. Do you understand what runtime scenario triggered the code? (Read comments, git
   blame, surrounding context.)
2. Is that scenario still relevant after your change, or did the change eliminate
   the need for it?
3. Is there a test that would fail if the scenario recurs and the code is gone?
   If not, add one — or preserve a minimal version of the code.

Defensive code (empty catch blocks, fallback values, optional chaining guards,
cleanup calls) exists for a reason. It may look redundant during normal
operation but prevents failures during edge cases. Don't remove it without
understanding the edge case it guards against.
