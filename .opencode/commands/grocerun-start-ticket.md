---
description: Legacy alias for /grocerun-plan. Analyze or refine a planning ticket before implementation.
---

# Start Ticket Workflow (Legacy)

Prefer `/grocerun-plan` for new work. This command remains as a compatibility
alias for existing muscle memory.

Load the `grocerun-planning-ticket-notes`, `grocerun-ticket-analyzer`,
`grocerun-architecture-alignment`, `grocerun-test-impact`,
`grocerun-knowledge-sources`, and `grocerun-coding-style` skills.

---

## Instructions

1. Read the ticket from `planning/tickets/`, user story, intake item, or brainstorm document.
2. Run the Clarity Gate assessment (Phase 0 from `grocerun-ticket-analyzer`).
3. If CLARIFY or REJECT: present the questions to the user and STOP
4. If PROCEED: run the full Phase 1 analysis (codebase exploration, solution designs).
5. Ensure the planning ticket includes ADR/rule context, test impact, e2e semantics, and documentation impact guess.
6. Present the analysis for user approval before writing any code.

---

## After Approval

```
Proceed with the implementation. After each meaningful step:
1. Run `npm run lint` to verify no errors
2. Run `npm test` to verify no regressions
3. Commit with conventional commit message
```

## Completion

```
1. Update implementation notes, deviations, gotchas, and test notes in the ticket.
2. Run `/grocerun-review` to validate the changes.
3. Run `/grocerun-dod` before calling work complete.
```

## Ticket Context

$ARGUMENTS
