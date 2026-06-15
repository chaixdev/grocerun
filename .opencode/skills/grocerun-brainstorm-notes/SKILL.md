---
name: grocerun-brainstorm-notes
description: Use when writing Grocerun brainstorm notes for interactive idea exploration, options, trade-offs, open questions, and promotion decisions.
---

# Grocerun Brainstorm Notes

Brainstorming is interactive. This skill does not replace discussion; it defines
how to record the results of exploration.

## Output location

`planning/brainstorm/YYYY-MM-DDTHHMM_<topic-slug>.md`

## Required structure

```markdown
# Brainstorm: Title

**Status:** exploring | promoted | parked | rejected
**Date:** YYYY-MM-DD
**Source:** intake entry / user request / ticket link

## Problem Framing

## Goals

## Non-Goals

## Existing Context
- Relevant ADRs
- Relevant coding rules
- Existing implementation patterns
- Current project status constraints

## Options Considered

### Option A — Name
Pros, cons, risks, approximate effort.

### Option B — Name

## Open Questions

## Recommendation / Current Leaning

## Promotion Decision
- promote to planning ticket / continue brainstorm / park / reject
```

## Required checks

- Review relevant `wiki/adr/`, `wiki/rules/`, `wiki/technical-design/`, and
  `planning/tickets/PROJECT-STATUS.md` before recommending an approach.
- Do not hide uncertainty. Open questions are useful output.
- If a decision would contradict an ADR or durable technical design, call that out as a
  user decision gate.
