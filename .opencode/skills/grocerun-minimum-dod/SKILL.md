---
name: grocerun-minimum-dod
description: Use as the mandatory Grocerun closeout checklist for any change before calling work done.
---

# Grocerun Minimum Definition of Done

Every change must satisfy this gate.

## Minimum DoD checklist

```markdown
## Minimum DoD

### Documentation impact
- Reviewed: yes/no
- Docs updated: yes/no
- Rationale:

### E2E journey semantics
- Reviewed: yes/no
- E2E updated: yes/no
- Rationale:

### Overarching goals / architecture
- ADRs/rules/patterns respected: yes/no
- Tension or decision needed:

### Verification
- Commands run:
- Deferred verification and reason:

### Review findings
- Fixed:
- Deferred:
- Rejected with rationale:
- User decision needed:
```

## Rules

- This checklist is required even for small changes.
- If a section is not applicable, say why.
- Do not treat “no docs/tests needed” as implicit; record the rationale.
