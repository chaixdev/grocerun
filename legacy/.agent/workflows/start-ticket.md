---
description: Start work on a ticket from the backlog
---

# Start Ticket Workflow

Use this prompt when picking up a new ticket:

```
I want to start work on ticket [TICKET_ID] (e.g., GRO-13).

Please:
1. Read the ticket from `wiki/planning/tickets/backlog/[TICKET_ID]-*.md`
2. Read the parent User Story from `wiki/planning/user-stories/`
3. Review the related code files mentioned in "Technical Notes"
4. Create an implementation plan with:
   - Proposed file changes (schema, actions, components)
   - Acceptance criteria verification steps
   - Any questions or design decisions that need my input
5. Move the ticket to `wiki/planning/tickets/in-progress/`
6. Create a feature branch: `git checkout -b feature/[TICKET_ID]-short-name`

Wait for my approval before writing code.
```

## After Approval

```
Proceed with the implementation. After each major step:
1. Run `npm run lint` to verify no errors
2. Update the ticket status
3. Test the feature manually if applicable
```

## Completion

```
Mark the ticket as done:
1. Move ticket to `wiki/planning/tickets/done/`
2. Update the User Story acceptance criteria
3. Commit with message: "feat([TICKET_ID]): short description"
4. Push branch and open a PR
```
