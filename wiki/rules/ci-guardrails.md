# CI Guardrails

**Status:** Established
**Category:** Process / Enforcement
**Context:** TypeScript/Node/React/NestJS projects

Rules that aren't checked aren't real. This file defines the automated
enforcement that prevents violations from reaching production — lint rules,
CI gates, and PR requirements.

---

## 1. CI Pipeline Gates

Every push and PR must pass these gates in order. A failure at any gate
blocks the pipeline.

| Gate | What It Checks | Failure Action |
|------|---------------|----------------|
| **TypeScript** | `tsc --noEmit` across all packages | Block — type errors ship bugs |
| **Lint** | ESLint with project rules (see §2) | Block — style violations break consistency |
| **Unit + Integration Tests** | `vitest run` (server + web + dto) | Block — regressions must not merge |
| **Build** | `npm run build` (server + web) | Block — unshippable code must not merge |
| **E2E Smoke** | `npx playwright test --project=chromium` | Block — critical flows must not break |

A PR that passes all gates and has approval can merge. No merge without green CI.

---

## 2. ESLint Rules

These rules enforce the standards in [`coding-standards.md`](./coding-standards.md)
and [`production-quality.md`](./production-quality.md). They live in
`eslint.config.mjs` (flat config). All are set to `"error"`.

### 2.1 Type Safety

| Rule | Enforces |
|------|----------|
| `@typescript-eslint/no-explicit-any` | No `any` type (§1.4) |
| `@typescript-eslint/strict-boolean-expressions` | No implicit truthiness checks |
| `@typescript-eslint/no-unnecessary-condition` | Dead null checks |
| `@typescript-eslint/prefer-optional-chain` | Optional chaining over `&&` chains (§1.1) |
| `@typescript-eslint/prefer-nullish-coalescing` | `??` over `\|\|` (§1.1) |

### 2.2 Code Quality

| Rule | Enforces |
|------|----------|
| `no-console` | `console.log` banned in server (use `Logger`) and client (use toast/diagnostics) |
| `no-debugger` | No `debugger` statements |
| `@typescript-eslint/no-unused-vars` | No dead code (args prefixed with `_` are exempt) |
| `@typescript-eslint/no-floating-promises` | Every promise must be awaited or `.catch()`'d (§2.3) |
| `no-restricted-syntax` | Blocks `for...in`, `with`, labeled statements |
| `unicorn/no-array-for-each` | Prefer `for...of` over `.forEach` (avoids N+1 inside callback — §1.1 production-quality.md) |

### 2.3 Security

| Rule | Enforces |
|------|----------|
| `no-secrets/no-secrets` | No tokens, keys, or passwords in source |
| `@typescript-eslint/no-implied-eval` | No `eval`, `Function()` constructor |

### 2.4 Import Boundaries

Enforced via `@nx/enforce-module-boundaries` or equivalent in `eslint.config.mjs`:

| Constraint | Enforces |
|------------|----------|
| `apps/web` → `apps/server` | Blocked — cross-app import (§1 monorepo-boundaries.md) |
| `apps/server` → `apps/web` | Blocked — cross-app import |
| `apps/*` → `apps/_shared/dtos` | Allowed |
| Relative paths into `_shared/` | Blocked — must use `@grocerun/dto` |

---

## 3. PR Requirements

### 3.1 Checklist

Every PR description must include this checklist. Reviewers verify each item
before approval.

```
## PR Checklist
- [ ] TypeScript compiles with `strict: true`
- [ ] All API inputs have Zod validation (new or updated endpoints)
- [ ] Database queries include `deleted: false` (if applicable)
- [ ] New endpoints are paginated (if returning collections)
- [ ] No `await` inside loops over query results
- [ ] Log statements are structured JSON, no PII
- [ ] Outbound HTTP calls have explicit timeouts
- [ ] New dependencies audited for bundle size impact
- [ ] Tests cover happy path + one error path (new features)
- [ ] Commit messages follow Conventional Commits
```

### 3.2 Required Approvals

- At least one approving review from a team member.
- The reviewer must verify the PR checklist items, not just trust the
  author's checkmarks.
- AI-generated code is treated like any other code — must pass the
  same checks and review.

### 3.3 Auto-Checks

These run automatically on PR creation and update:

- **CI pipeline** (all gates from §1).
- **Bundle size report** — if vendor chunk grows >10%, a warning is posted.
- **Test coverage delta** — if coverage drops, a comment is posted. Coverage
  drops on new code require explicit justification.

---

## 4. Pre-Commit Hooks

Husky + lint-staged run on `git commit`:

```json
{
  "*.{ts,tsx}": ["eslint --fix --max-warnings 0", "prettier --write"],
  "*.prisma": ["prisma format"]
}
```

- ESLint fixes automatically where possible (formatting, import sorting).
- `max-warnings 0` means any remaining ESLint warning blocks the commit.
- These are fast (lint-staged runs only on staged files). Full CI runs on push.
- To bypass in emergencies: `git commit --no-verify`. Must be justified in
  the commit message and followed by a fixup commit.

---

## 5. Adding a New Guard

When you add a rule to any `wiki/rules/` file:

1. **Can it be automated?** Check if ESLint, TypeScript, or a test can
   enforce it. If yes, add the automation first, then document it here.
2. **Add a CI gate** if it's checkable in CI. Update §1.
3. **Add a PR checklist item** if it requires human review. Update §3.1.
4. **Add an ESLint rule** if one exists. Update §2.
5. **Remove the checklist item** once the automation exists — human
   checks drift; automated checks don't.

Goal: every rule in `wiki/rules/` has either an automated check or an
explicit decision that it can't be automated (with reason documented).

---

## 6. Implementation Rules

1. CI pipeline must pass (TypeScript + lint + tests + build) before any merge
2. ESLint `no-explicit-any` is `"error"` — no `any` without explicit disable comment
3. Every PR includes the checklist from §3.1 — reviewers verify, not trust
4. Pre-commit hooks block commits with ESLint warnings — `max-warnings 0`
5. New rules added to `wiki/rules/` must include an enforcement mechanism
6. Import boundary violations are caught by lint, not code review
7. Console logging is banned in committed code — `no-console` is `"error"`
8. No secrets in source — `no-secrets/no-secrets` blocks tokens and keys
9. Bundle size regression >10% posts a warning on the PR
10. Pre-commit bypass (`--no-verify`) requires justification in commit message

---

## Related Documents

| File | Scope |
|------|-------|
| [coding-standards.md](./coding-standards.md) | The standards these guards enforce |
| [production-quality.md](./production-quality.md) | Performance, observability, reliability rules |
| [testing-standards.md](./testing-standards.md) | Test requirements enforced in CI |
| [monorepo-boundaries.md](./monorepo-boundaries.md) | Import rules enforced by lint |
