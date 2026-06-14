# Agentic Development Workflow

## Overview

This document defines the three-phase workflow for AI-assisted development of
Grocerun using OpenCode agents and skills. The process ensures deliberate
planning, quality execution, and continuous improvement.

---

## Three Phases

### Phase 1: Planning & Discovery
**Objective:** Understand requirements, align on approach, document decisions.

**Activities:**
1. **Requirements Clarification**
   - User describes feature/bug/refactor
   - Agent asks clarifying questions
   - Align on acceptance criteria

2. **Technical Design**
   - Propose architecture/approach
   - Discuss trade-offs (performance, complexity, maintainability)
   - Document decision in ADR if significant

3. **Scope Definition**
   - Break work into discrete, testable tasks
   - Identify files/components to modify
   - Flag potential risks or dependencies

**Artifacts:**
- Planning document (e.g., `planning/tickets/PHASE-5-SIMPLIFICATION.md`)
- ADR for major technical decisions (e.g., `wiki/adr/007-phase4-local-first-strategy.md`)
- Task breakdown

**Agent workflow:** Use `/grocerun-start-ticket` to run the ticket analyzer
(clarity gate → solution designs → approval before coding).

---

### Phase 2: Execution
**Objective:** Implement changes with precision, validate continuously.

**Protocols:**

#### A. Visual Parity Protocol
For UI changes:
1. **Before Screenshot**: Capture current state
2. **Implement Change**: Make code modifications
3. **After Screenshot**: Capture new state
4. **Diff Review**: User verifies visual changes match intent

#### B. Incremental Validation
For backend/logic changes:
1. **Write Test First** (TDD when applicable)
2. **Implement Feature**
3. **Run Tests** (`npm test`)
4. **Manual Verification** (if needed)

#### C. Commit Hygiene
- **Atomic Commits**: One logical change per commit
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`
- **Descriptive Messages**: What and why, not just what

**Example:**
```
feat(lists): add position field for custom sorting

- Add position column to ListItem schema
- Update reorderListItems action to set positions
- Migrate existing data with default positions
```

---

### Phase 3: Debrief & Documentation
**Objective:** Reflect on work, update documentation, prepare for next session.

**Activities:**
1. **Update Status Documents**
   - Mark completed tasks in `planning/tickets/PROJECT-STATUS.md`
   - Update phase migration checklists
   - Note blockers or open questions

2. **Document Learnings**
   - Add to developer guide if pattern is reusable
   - Update ADR with "Status: Superseded" if decision changes
   - Note gotchas in comments or wiki

3. **Run Deep Review**
   - Use `/grocerun-review` before merging to catch defects
   - Review output goes to `planning/reviews/`

4. **Prepare Handoff**
   - Summarize what was accomplished
   - List next steps explicitly
   - Flag anything user should manually verify

**Artifacts:**
- Updated status docs
- Code review in `planning/reviews/`
- Commit history with clear messages

---

## Agent Tooling

### Skills to Load
- `grocerun-coding-style` — Before any implementation or review
- `grocerun-knowledge-sources` — For project context and key files
- `repo-dev-commands` — For build/test/run commands
- `grocerun-deep-reviewer` — For code review (loaded by `/grocerun-review`)
- `grocerun-ticket-analyzer` — For ticket analysis (loaded by `/grocerun-start-ticket`)

### Commands
- `/grocerun-start-ticket` — Analyze a ticket, get approval, then implement
- `/grocerun-review` — Deep review of current branch against main

### Code Reading
- Use `glob`/`grep` for file and pattern discovery
- Use `read` for reading source files
- Use `task` with `explorer` subagent for broad codebase exploration

### Code Writing
- Use `edit` for surgical changes in existing files
- Use `write` only for new files
- Prefer editing existing files over creating new ones

### Verification
- `npm run lint` — Catch TypeScript and ESLint issues
- `npm test` — Run unit tests
- `npm run build` — Verify full build
- `cd apps/e2e && npx playwright test` — Run e2e tests

---

## Documentation Routing

| If you are writing... | Put it in... |
|----------------------|-------------|
| An architectural decision | `wiki/adr/` |
| A coding rule or convention | `wiki/rules/` |
| A stable implementation pattern | `wiki/patterns/` |
| A durable domain concept | `wiki/concepts/` |
| A developer guide | `wiki/development/` |
| A work ticket/plan | `planning/tickets/` |
| Speculative solution exploration | `planning/brainstorm/` |
| A code review | `planning/reviews/` |

---

**Status:** Active
**Last Updated:** June 8, 2026
