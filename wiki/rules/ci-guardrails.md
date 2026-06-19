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
`eslint.config.mjs` (flat config).

### 2.1 Implemented Rules

These rules are active in both `apps/web/eslint.config.mjs` and
`apps/server/eslint.config.mjs`:

| Rule | Level | Enforces |
|------|-------|----------|
| `@typescript-eslint/no-explicit-any` | `error` | No `any` type (§1.4 coding-standards.md) |
| `@typescript-eslint/no-unused-vars` | `error` | No dead code (args prefixed `_` exempt) |
| `no-console` | `error` (server) / `warn` (web, allows `error`/`warn`) | `console.log` banned; server uses NestJS `Logger`, client uses `console.error`/`console.warn` for diagnostics |
| `no-debugger` | `error` (via `js.configs.recommended`) | No `debugger` statements |

### 2.2 Deferred Rules — Type-Aware Linting

These rules require `parserOptions.project` (type-aware linting), which
slows ESLint by 2-5x. They are deferred until the codebase grows or a
regression justifies the cost. A codebase audit (2026-06-20) found **0
instances** of the patterns these rules would catch.

| Rule | What It Catches | Audit Findings | Defer Reason |
|------|----------------|----------------|--------------|
| `@typescript-eslint/strict-boolean-expressions` | Implicit truthiness on `0`/`""`/`false` | ~40 truthy checks, most on nullable types — legitimate | Noisy, high false-positive rate |
| `@typescript-eslint/no-unnecessary-condition` | Dead null checks | 0 found | No current value |
| `@typescript-eslint/prefer-optional-chain` | `x && x.y` instead of `x?.y` | 0 found — codebase uses `?.` | No current value |
| `@typescript-eslint/prefer-nullish-coalescing` | `\|\|` where `??` is correct | 0 found — all `\|\|` defaults are env vars/strings | No current value |
| `@typescript-eslint/no-floating-promises` | Promises without `await`/`.catch()` | 0 found — all promises properly awaited | No current value |

**Revisit trigger:** When a bug reaches production that one of these rules
would have caught, implement that specific rule.

### 2.3 Deferred Rules — Plugin Dependencies

These rules require ESLint plugins not currently installed. A codebase
audit (2026-06-20) found **0 instances** of the patterns they would catch.

| Rule | Plugin | Audit Findings | Defer Reason |
|------|--------|----------------|--------------|
| `no-secrets/no-secrets` | `eslint-plugin-no-secrets` | 0 hardcoded secrets | No current value |
| `@typescript-eslint/no-implied-eval` | type-aware (§2.2) | 0 `eval`/`Function()` calls | No current value |
| `unicorn/no-array-for-each` | `eslint-plugin-unicorn` | 2 acceptable instances (cleanup arrays) | Low value, stylistic preference |
| `no-restricted-syntax` (for...in) | built-in | 0 `for...in` loops | No current value |

### 2.4 Import Boundaries — Manual Enforcement

The `@nx/enforce-module-boundaries` rule requires Nx, but this project
uses Turbo. Import boundaries are enforced by convention and code review
until a Turbo-compatible lint solution is identified.

A codebase audit (2026-06-20) found **0 violations**:

| Constraint | Status |
|------------|--------|
| `apps/web` → `apps/server` | No violations found |
| `apps/server` → `apps/web` | No violations found |
| `apps/*` → `apps/_shared/dtos` | Properly uses `@grocerun/dto` alias |
| Relative paths into `_shared/` | No violations found |

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
3. `no-console` is `"error"` on server (use NestJS `Logger`), `"warn"` on web
   (allows `console.error`/`console.warn` for client-side diagnostics)
4. Every PR includes the checklist from §3.1 — reviewers verify, not trust
5. Pre-commit hooks block commits with ESLint warnings — `max-warnings 0`
6. New rules added to `wiki/rules/` must include an enforcement mechanism
7. Import boundary violations are caught by code review (§2.4)
8. Deferred rules (§2.2, §2.3) are revisited when a regression justifies them
9. Bundle size regression >10% posts a warning on the PR
10. Pre-commit bypass (`--no-verify`) requires justification in commit message

---

## Related Documents

| File | Scope |
|------|-------|
| [coding-standards.md](./coding-standards.md) | The standards these guards enforce |
| [production-quality.md](./production-quality.md) | Performance, observability, reliability rules |
| [testing-standards.md](./testing-standards.md) | Test requirements enforced in CI |
| [monorepo-boundaries.md](./monorepo-boundaries.md) | Import rules enforced by review |
