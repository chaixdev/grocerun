---
name: grocerun-test-impact
description: Use when deciding Grocerun unit, server integration, web component, e2e, and UAT test impact for a change.
---

# Grocerun Test Impact

Use this skill to decide what test changes are required.

## Test impact checklist

```markdown
## Test Impact

- **Unit tests:** needed / not needed — rationale
- **Server integration tests:** needed / not needed — rationale
- **Web component tests:** needed / not needed — rationale
- **E2E journey semantics:** affected / unaffected — rationale
- **Manual/UAT:** what the user should verify
```

## E2E journey semantics

Review e2e tests when:

- user journey steps change
- auth/session behavior changes
- sync/local-first behavior changes
- onboarding/setup/settings behavior changes
- error/recovery behavior changes
- a critical journey assertion no longer matches intended product semantics

If no e2e update is needed, state why explicitly.
