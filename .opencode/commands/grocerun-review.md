---
description: >
  Deep code review of the current branch against main. Loads the
  grocerun-deep-reviewer and grocerun-coding-style skills, injects branch
  context, and executes a four-phase parallel review.
---

Load the `grocerun-deep-reviewer`, `grocerun-coding-style`,
`grocerun-architecture-alignment`, `grocerun-test-impact`, and
`grocerun-documentation-extraction` skills, then conduct a thorough review
following the operating procedure defined in those skills exactly.

---

## Branch Context

Current branch:
!git branch --show-current

Merge base with main:
!git merge-base HEAD main

Commits on this branch:
!git log --oneline $(git merge-base HEAD main)..HEAD

Changed files (with line counts):
!git diff --stat $(git merge-base HEAD main)..HEAD

---

## Ticket / Task Context

$ARGUMENTS

---

## Review Instructions

Follow the four-phase operating procedure from the `grocerun-deep-reviewer` skill:

**Phase 1 — Context Acquisition**
Read all changed files in parallel (parallel tool calls, not sequential).
Read their associated test files in parallel.
Read relevant supporting context files (callers, hooks, API routes, Prisma schema) in parallel.
Build the structural inventory before proceeding.

**Phase 2 — Parallel Track Analysis**
Launch all five analysis track sub-tasks simultaneously.
Do not wait for one to finish before starting the next.

For each track sub-task:
- Pass the changed file list (paths), branch context, and ticket intent.
- Cross-reference the appropriate coding standards sections using `grocerun-coding-style`.
- Instruct the sub-task to read all changed files independently.
- Instruct the sub-task to return findings in the structured format from the reviewer skill.

The five tracks are defined in full in the `grocerun-deep-reviewer` skill:
- Track A — Logic & Correctness
- Track B — Data & Persistence
- Track C — React & UI
- Track D — Security & Observability
- Track E — Structure & Quality

**Phase 3 — Aggregation**
Collect all track findings. Identify cross-track hits (same file, nearby line) and
elevate their severity. Deduplicate. Run test gap analysis.

**Phase 4 — Synthesis**
Write the structured review document following the output format in the reviewer skill:
summary + verdict, findings with IDs, priority action table, test gaps, positive notes.

---

## Output

Write the completed review to:
`planning/reviews/$(date +%Y-%m-%d)_review_$(git branch --show-current | tr '/' '-').md`

Create the directory first: `mkdir -p planning/reviews`

The review must explicitly cover:
- planning ticket and implementation-note consistency
- e2e journey semantics vs delivered behavior
- documentation extraction candidates
- ADR/rule/technical-design tension
- findings classified as fixed, deferred, rejected, or user decision needed
