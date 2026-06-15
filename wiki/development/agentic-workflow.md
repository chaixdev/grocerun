# Agentic Development Workflow

**Status:** Active
**Last Updated:** June 15, 2026

This document is the north-star workflow for AI-assisted Grocerun development.
It describes the development loop we want to follow before encoding more of it
into reusable opencode skills, commands, and eventually a dedicated orchestrator
agent.

The goal is not ceremony for its own sake. The goal is to preserve product
intent, architectural consistency, test semantics, and durable documentation as
features move from rough ideas to accepted code.

---

## Principles

1. **Every idea has a home.** Vague requests, bugs, and feature ideas should not
   disappear into chat history. They are captured in a centralized intake place.

2. **Planning and implementation stay connected.** Planning documents are not
   throwaway artifacts. They collect implementation notes, deviations, gotchas,
   decisions, and follow-ups.

3. **Review is a gate, not a courtesy.** Oracle review is a required failsafe
   for meaningful work. Findings must be fixed, deferred, rejected with
   rationale, or escalated for user decision.

4. **Tests encode user journeys and system semantics.** Unit, integration, and
   e2e tests should be updated when delivered behavior changes. E2E tests are
   especially important for preserving critical journey meaning after refactors.

5. **Canonical docs lag only until acceptance.** Planning docs can be messy and
   historical. Once UAT accepts a feature, durable knowledge is extracted into
   `wiki/` as guides, technical designs, rules, or ADRs.

6. **The loop improves itself.** Oracle findings and user feedback should feed
   back into either documentation extraction (rules, technical designs, ADRs,
   guides) or
   process improvements (templates, commands, skills, decision gates).

7. **Work happens on a feature branch.** The loop should run on a separate
   branch. Commits are atomic throughout the loop, then reviewed and squashed by
   logical grouping before merge through the UI.

---

## Workflow Overview

```text
Intake
  → Brainstorm (optional)
  → Planning ticket
  → Implementation + implementation notes
  → Tests updated
  → Oracle review
  → Review/UAT feedback mini-cycle
  → Documentation extraction
  → Process retrospective
  → Commit review + logical squash
  → Manual merge via UI
```

Not every change needs every optional stage, but every change must satisfy the
minimum Definition of Done.

---

## Stage 0 — Feature Intake

**Purpose:** Capture raw ideas and requests in one central place before they are
planned.

Use for:
- vague feature requests
- bug reports
- improvement ideas
- UX friction
- architectural concerns
- test/process improvement ideas

Output:
- a short entry in a centralized intake document, such as
  `planning/tickets/FEATURE-INTAKE.md`

Each entry should include:
- short title
- raw user/request context
- category: feature / bug / UX / architecture / test / process
- current status: captured / needs brainstorm / promoted / parked / rejected
- links to later brainstorm or ticket documents

Intake is intentionally lightweight. It should not block conversation.

---

## Stage 1 — Brainstorm

**Purpose:** Explore ambiguity before committing to implementation.

Use when:
- the request is vague or multi-directional
- several solution paths exist
- architecture or ADR tension is likely
- scope boundaries are unclear
- the work may create durable technical designs or rules

Output:
- `planning/brainstorm/YYYY-MM-DDTHHMM_<topic>.md`

A brainstorm should capture:
- problem framing
- goals and non-goals
- options considered
- trade-offs
- relevant existing ADRs, rules, and technical designs
- recommendation
- open questions
- whether to promote to a planning ticket

Brainstorm documents are speculative. They can be superseded or abandoned.

---

## Stage 2 — Planning Ticket

**Purpose:** Convert an accepted idea into an implementation-ready plan.

Output:
- `planning/tickets/<slug>.md`

A planning ticket should include:
- status
- background / problem statement
- user-facing goal
- acceptance criteria
- scope and non-scope
- affected apps/packages/files if known
- relevant ADRs, coding rules, and technical designs
- implementation outline
- test strategy
- e2e journey impact assessment
- documentation impact guess
- risks and open questions

The planning ticket is updated during implementation. It is the living record of
what was intended and what actually happened.

---

## Stage 3 — Branch and Commit Discipline

Every feature loop should happen on a new branch.

Recommended commit rhythm:

1. planning/brainstorm artifacts
2. implementation slices
3. tests
4. oracle review fixes
5. UAT feedback fixes
6. documentation extraction
7. process improvements

Commits should be:
- atomic
- conventional (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`)
- understandable without chat context

At the end of the loop:
- inspect the full branch commit list
- squash or reorder into logical groups if needed
- merge manually into `origin/main` through the UI

---

## Stage 4 — Implementation

**Purpose:** Deliver the planned change while preserving architectural and code
style constraints.

Implementation must happen with awareness of:
- `planning/tickets/PROJECT-STATUS.md`
- relevant planning/brainstorm documents
- relevant ADRs in `wiki/adr/`
- `wiki/rules/coding-standards.md`
- relevant technical designs in `wiki/technical-design/`
- existing e2e journey semantics

During implementation, enrich the planning ticket with:
- implementation notes
- deviations from the plan
- gotchas discovered
- rationale for deviations
- follow-up items
- testing notes
- documentation notes

These notes are important context for oracle review and later documentation
extraction.

---

## Stage 5 — Tests Updated

Tests are part of implementation, not a final polish step.

For every feature, review:

- **Unit tests:** pure helpers, guards, parsing, state machines, small utilities.
- **Server integration tests:** controllers, services, auth, Prisma, sync,
  soft-delete, authorization, migrations.
- **Web component tests:** UI state, forms, hooks, interaction semantics.
- **E2E tests:** critical user journeys and cross-page behavior.

E2E tests should be updated when:
- user journey semantics changed
- a critical workflow gains or loses a step
- auth/session behavior changes
- local-first/sync behavior changes
- a prior e2e assertion no longer represents intended product behavior

If tests are not added or updated, the planning ticket should state why.

---

## Stage 6 — Oracle Review

**Purpose:** Independent technical audit before acceptance.

Oracle review should evaluate:
- the planning ticket
- implementation notes
- delivered code
- tests
- relevant docs, ADRs, and rules
- e2e journey semantics

Review tracks should include:
- codebase consistency
- correctness
- security
- reliability and data integrity
- architecture and ADR alignment
- maintainability and YAGNI
- test sufficiency
- documentation gaps
- process gaps

Each oracle finding must be classified:

| Classification | Meaning |
|---|---|
| Fixed now | Addressed before acceptance |
| Deferred | Captured as follow-up planning item |
| Rejected | Explicit rationale recorded |
| User decision | Needs product/architecture decision |

Oracle is a failsafe, not a replacement for planning. If oracle catches a
durable documentation/rule/pattern gap, handle it during documentation
extraction. If oracle catches a loop execution problem, handle it during the
process retrospective.

---

## Stage 7 — Review / UAT Feedback Mini-Cycle

After oracle fixes, the user performs UAT or reviews behavior.

UAT feedback can result in:
- implementation fix
- test update
- planning ticket update
- follow-up ticket
- rejected feedback with rationale
- documentation extraction item

The feature is not accepted until UAT feedback is resolved or explicitly
deferred.

---

## Stage 8 — Documentation Extraction

**Purpose:** Promote durable knowledge from planning/history into canonical docs.

After feature acceptance, review whether to update:

| Documentation type | Location |
|---|---|
| User-facing guide | `wiki/development/` or future user docs |
| Developer guide | `wiki/development/` |
| Architectural decision | `wiki/adr/` |
| Feature-level technical design | `wiki/technical-design/` |
| Coding rule/convention | `wiki/rules/` |
| Project status | `planning/tickets/PROJECT-STATUS.md` |

Documentation extraction is also where repeated review findings become durable
guidance. If oracle, UAT, or implementation notes reveal recurring issues,
decide whether they should become:

- a coding rule
- a technical design document
- a planning template section
- an ADR update
- a developer guide note
- a follow-up ticket instead of canonical documentation

If no canonical documentation changes are needed, state that explicitly in the
planning ticket or final summary.

---

## Stage 9 — Process Retrospective

**Purpose:** Improve the agentic loop itself.

After acceptance, review:

- What required avoidable back-and-forth?
- Did the process surface documentation extraction needs at the right time?
- Did the planning ticket miss information that would have reduced iteration?
- Did tests fail to catch something they should have caught?
- Did e2e journey semantics review happen early enough?
- Were user decision gates clear and timely?
- Should a command or skill be adjusted?

Outputs may include:
- planning follow-up
- command/skill update
- no-op note explaining why no process change is needed

---

## Minimum Definition of Done

Every change, including small fixes, must satisfy this minimum gate.

### 1. Documentation impact reviewed

- Does `wiki/` need updating?
- Does the planning ticket or project status need updating?
- Did we introduce a durable technical design, gotcha, or decision?
- If no docs are updated, explicitly note: docs reviewed; no update needed.

### 2. E2E journey semantics reviewed

- Does the change affect an existing critical journey?
- Do current e2e tests still describe intended behavior?
- Did the implementation shift semantics enough to require e2e updates?
- If no e2e change is needed, explicitly state why.

### 3. Overarching goals respected

- Does the change preserve current architecture and ADR direction?
- Does it respect coding standards?
- Does it avoid reintroducing deprecated patterns?
- Does it preserve local-first/RxDB/auth/sync assumptions where relevant?

### 4. Verification completed

- Relevant build/test/lint commands run, or explicitly deferred with reason.
- If tests were not added or updated, explain why.

### 5. Review findings classified

Any review findings are classified as fixed, deferred, rejected, or needing user
decision.

---

## Intended Command / Skill Direction

The workflow should be encoded gradually as composable skills and commands, not
as a single autonomous agent yet.

Workflow skills:
- `grocerun-intake-notes`
- `grocerun-brainstorm-notes`
- `grocerun-planning-ticket-notes`
- `grocerun-implementation-notes`
- `grocerun-architecture-alignment`
- `grocerun-test-impact`
- `grocerun-minimum-dod`
- `grocerun-documentation-extraction`
- `grocerun-process-retro`

Existing skills remain part of the loop:
- `grocerun-knowledge-sources`
- `grocerun-coding-style`
- `grocerun-ticket-analyzer`
- `grocerun-deep-reviewer`
- `repo-dev-commands`

Stage commands:
- `/grocerun-intake`
- `/grocerun-brainstorm`
- `/grocerun-plan`
- `/grocerun-implement`
- `/grocerun-review`
- `/grocerun-dod`
- `/grocerun-retro`

Once these commands are validated through real feature work, the process can be
promoted into a dedicated orchestrator agent with explicit user decision gates.

---

## Legacy Supporting Commands

- `/grocerun-start-ticket` — legacy alias-style command for planning analysis;
  prefer `/grocerun-plan` for new work.
