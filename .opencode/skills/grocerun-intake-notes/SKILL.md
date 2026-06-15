---
name: grocerun-intake-notes
description: Use when logging vague Grocerun feature requests, bugs, UX ideas, architecture concerns, test/process improvements, or raw ideas into FEATURE-INTAKE.md.
---

# Grocerun Intake Notes

Use this skill to append raw ideas to `planning/tickets/FEATURE-INTAKE.md`.

## Goal

Capture the idea without over-planning it. Intake should be fast and low-friction.

## Required entry format

```markdown
### YYYY-MM-DD — Short title

- **Status:** captured | needs-brainstorm | promoted | parked | rejected
- **Category:** feature | bug | UX | architecture | test | process
- **Raw request:** quote or summarize the user's request
- **Context / notes:** relevant constraints, examples, links, affected area guesses
- **Links:** brainstorm/ticket/review/ADR links as they emerge
```

## Status guidance

- `captured` — clear enough to remember, not yet triaged.
- `needs-brainstorm` — multiple possible directions or unclear scope.
- `promoted` — linked to a planning ticket or user story.
- `parked` — valid but not timely.
- `rejected` — intentionally not pursuing; include rationale.

## Rules

- Do not turn intake into a planning ticket unless explicitly asked.
- Preserve raw user language when useful.
- Link later artifacts instead of duplicating them.
