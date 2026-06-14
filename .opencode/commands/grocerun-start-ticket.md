---
description: Start work on a planning ticket or user story
---

# Start Ticket Workflow

Load the `grocerun-ticket-analyzer` skill and the `grocerun-knowledge-sources` skill.

---

## Instructions

1. Read the ticket from `planning/tickets/` or the user story from `planning/tickets/user-stories/`
2. Run the Clarity Gate assessment (Phase 0 from `grocerun-ticket-analyzer`)
3. If CLARIFY or REJECT: present the questions to the user and STOP
4. If PROCEED: run the full Phase 1 analysis (codebase exploration, solution designs)
5. Present the analysis for user approval before writing any code

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
1. Move ticket to done status (update status in the doc)
2. Update the parent user story acceptance criteria if applicable
3. Update `planning/tickets/PROJECT-STATUS.md` with progress
4. Run `/grocerun-review` to validate the changes
```

## Ticket Context

$ARGUMENTS
