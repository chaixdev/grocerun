# Agentic Development Workflow

## Overview
This document defines the three-phase workflow for AI-assisted development of Grocerun. The process ensures deliberate planning, quality execution, and continuous improvement.

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
   - Document decision in ADR (Architecture Decision Record) if significant

3. **Scope Definition**
   - Break work into discrete, testable tasks
   - Identify files/components to modify
   - Flag potential risks or dependencies

**Artifacts:**
- Discussion document (e.g., `planning/phase-2-api-proxy.md`)
- ADR for major technical decisions (e.g., `adr/001-phase2-api-approach.md`)
- Task breakdown (e.g., checklist in `PHASE-2-MIGRATION.md`)

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
   - Mark completed tasks in `PROJECT-STATUS.md`
   - Update migration checklists (e.g., `PHASE-2-MIGRATION.md`)
   - Note blockers or open questions

2. **Document Learnings**
   - Add to developer guide if pattern is reusable
   - Update ADR with "Status: Superseded" if decision changes
   - Note gotchas in comments or wiki

3. **Prepare Handoff**
   - Summarize what was accomplished
   - List next steps explicitly
   - Flag anything user should manually verify

**Artifacts:**
- Updated status docs
- Commit history with clear messages
- Optional: Release notes for user-facing changes

---

## Workflow Example: Adding "Shopping Mode" Feature

### Phase 1: Planning
```
User: "I want a shopping mode that hides checked items and sorts by section."
Agent: "Clarifying: Should this be a toggle per list, or global setting?"
User: "Per list, so roommates can have different views."
Agent: "Got it. I'll add a `viewMode` field to ShoppingList and update the UI."
```
**Artifact:** Created `planning/shopping-mode.md` with design.

### Phase 2: Execution
```
1. Schema change: Add `viewMode` enum to ShoppingList
2. Migration: Run `npx prisma migrate dev`
3. Update action: Modify `toggleViewMode` server action
4. UI change: Add toggle button to list header
5. Test: Verify toggle persists and filters correctly
6. Commit: `feat(lists): add shopping mode toggle`
```
**Artifact:** Code changes + test coverage.

### Phase 3: Debrief
```
Agent: "Completed shopping mode feature. Verified:
- Toggle persists in database
- Checked items hidden when enabled
- Sorting by section works
Next: Add keyboard shortcut for power users?"
```
**Artifact:** Updated `PROJECT-STATUS.md`.

---

## Best Practices

### For Planning
- ✅ Discuss trade-offs openly (performance vs. simplicity)
- ✅ Use ADRs for non-obvious technical choices
- ❌ Don't skip directly to coding without alignment

### For Execution
- ✅ Make small, verifiable changes
- ✅ Test as you go (avoid "big reveal" at end)
- ❌ Don't batch unrelated changes in one commit

### For Debrief
- ✅ Update docs immediately (memory fades)
- ✅ Note TODOs explicitly (don't assume you'll remember)
- ❌ Don't leave work "95% done" without documenting the 5%

---

## Tools & Techniques

### Code Reading
- Use `semantic_search` for "How is X implemented?"
- Use `grep_search` for exact string/pattern matches
- Use `list_code_usages` to find all call sites

### Code Writing
- Use `replace_string_in_file` for surgical edits
- Use `multi_replace_string_in_file` for batch changes
- Always include 3+ lines of context in old/new strings

### Verification
- Use `get_errors` after edits to catch TypeScript issues
- Use `run_in_terminal` for `npm test`, `npm run build`
- Use `get_terminal_output` for long-running processes

---

**Status:** Active  
**Last Updated:** January 9, 2026
