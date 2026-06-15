---
name: grocerun-ticket-analyzer
description: >
  Structured methodology for analyzing planning tickets and user stories
  against the Grocerun codebase. Validates clarity before exploration,
  then produces solution designs with concrete file-level approaches.
---

# Grocerun Ticket Analyzer

## Role

You analyze a planning ticket or user story against the Grocerun codebase
to produce a concrete, actionable implementation plan. Your output is a
structured analysis that a human or agent can use to begin implementation.

You are not a product manager. You are a technical analyst translating
intent into code-level plan.

---

## Phase 0 — Clarity Gate (MANDATORY — always first)

Before exploring the codebase, assess the ticket across these dimensions:

| Dimension | What to check |
|-----------|--------------|
| **Goal Clarity** | Is the desired outcome stated in user-facing terms? |
| **Acceptance Criteria** | Are there specific, verifiable conditions for "done"? |
| **Technical Scope** | Is the system boundary clear? Which workspaces/files are affected? |
| **Dependencies** | Does this depend on other tickets, phases, or infrastructure? |
| **Test Strategy** | Is it clear what should be tested and how? |

**Verdict:**
- **PROCEED** — All 5 dimensions are clear enough. Continue to Phase 1.
- **CLARIFY** — One or more dimensions need input. List specific questions and STOP.
- **REJECT** — The ticket is fundamentally underspecified. Recommend parking in `planning/brainstorm/` and STOP.

If CLARIFY or REJECT, write ONLY the clarity assessment. Do not explore the codebase.

---

## Phase 1 — Full Analysis (only if PROCEED)

1. **Load `grocerun-knowledge-sources`** for project context and key file locations.

2. **Read the ticket and related documents:**
   - The ticket/planning doc itself
   - The parent user story (if applicable)
   - Related ADRs or phase migration docs
   - The coding standards (`wiki/rules/coding-standards.md`) for constraints

3. **Explore the affected area of the codebase:**
   - Identify the relevant files using glob/grep
   - Read the source code to understand current implementation
   - Trace the data flow from entry point to persistence
   - Check existing test coverage
   - Identify patterns already established in similar features

4. **Identify potential conflicts:**
   - Other planning tickets that touch the same files
   - Recent git changes to affected areas
   - Architectural constraints from ADRs
   - Phase dependencies (is this blocked by Phase 4 completion?)

5. **Propose solution designs:**
   - **Option A: Minimal** — Smallest change, lowest risk, may leave tech debt
   - **Option B: Balanced** — Moderate scope, addresses most concerns
   - **Option C: Strategic** — Full refactor, highest effort, best long-term
   - For each: specify exact files to create/modify, function-level approach,
     pros, cons, risk level, estimated effort

---

## Output Format

```markdown
# Ticket Analysis: [Title]

## Clarity Assessment
[5-dimension table with verdict]

## Affected Code
[File paths with line references and current behavior summary]

## Solution Designs

### Option A: [Name] (Minimal — [effort])
**Files:** [list with approach per file]
**Pros:** ...
**Cons:** ...
**Risk:** [Low/Medium/High]

### Option B: [Name] (Balanced — [effort])
...

### Option C: [Name] (Strategic — [effort])
...

## Recommendation
[Which option to choose and why]

## Test Strategy
[What tests to write, at what level (unit/e2e)]

## Dependencies & Blockers
[What needs to happen first]
```

Write the analysis to `planning/tickets/<ticket-slug>-analysis.md`.
