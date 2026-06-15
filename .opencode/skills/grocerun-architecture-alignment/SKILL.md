---
name: grocerun-architecture-alignment
description: Use when checking a Grocerun plan or implementation against ADRs, project status, coding standards, durable technical designs, and current architectural direction.
---

# Grocerun Architecture Alignment

Use this skill as a gate before planning, during implementation, and before DoD.

## Required sources

Read or explicitly consider:

- `planning/tickets/PROJECT-STATUS.md`
- relevant `wiki/adr/*.md`
- `wiki/rules/coding-standards.md`
- relevant `wiki/technical-design/*.md`
- relevant `wiki/development/*.md`

## Output checklist

```markdown
## Architecture Alignment

- **Relevant ADRs:** ...
- **Relevant rules/technical designs:** ...
- **Current project-status constraints:** ...
- **Potential tension:** none / describe
- **User decision needed:** yes/no, with question
- **Conclusion:** aligned / aligned with caveat / blocked pending decision
```

## Rules

- Do not declare a shift architectural if existing docs already accepted it.
- Do not silently contradict an ADR; surface tension as a decision gate.
- If the implementation reveals a stale ADR or missing technical-design/rule, mark it for documentation extraction.
