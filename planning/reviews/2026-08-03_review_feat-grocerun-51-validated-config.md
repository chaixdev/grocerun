# Review: GROCERUN-51 — Validated ConfigService

**Branch:** `feat/grocerun-51-validated-config`
**Date:** 2026-08-03
**Reviewer:** Deep Reviewer (automated)
**Merge base:** `0a76c38` (tag 1.0.1)
**HEAD:** `96c0207`

> **Correction notice:** An earlier version of this review incorrectly stated
> that GROCERUN-51 was unimplemented because `config.ts` was uncommitted at
> review time. The work has since been committed (`eae1bee`). This version
> reviews the committed code.

---

## Section 1 — Summary

GROCERUN-51 delivers a Zod-validated environment configuration module
(`apps/server/src/config.ts`) that replaces six scattered `process.env` reads
across the server with a single boot-time-validated `env` singleton. The
schema covers `NODE_ENV`, `PORT`, `DATABASE_URL`, `WEB_URL`, `OIDC_ISSUER_URI`,
`OIDC_AUDIENCE`, `OIDC_PROVIDER`, and declares `DB_DRIVER`/`STORAGE_DRIVER`/
`STORAGE_LOCAL_FS_PATH` as future seams for GROCERUN-53. A `superRefine`
conditionally requires `OIDC_AUDIENCE` in non-test environments, and the
module fails fast at boot with a formatted error if validation fails. The
commit also adds a web-side `oidc-config.ts` with `isGoogleIssuer()` (URL-
parsed hostname check) and `resolveOidcConfig()` for safe Google-specific
`__unsafe_*` option gating, backed by 15 unit tests.

The implementation is solid and well-tested (125 server + 99 web tests pass).
The most important finding is that the deliverable is a module-level
singleton, not a NestJS `@Injectable()` ConfigService — the ticket title
implies an injectable service class. This works correctly and tests pass,
but it bypasses NestJS DI and will make future config-dependent tests harder
to isolate. Secondary findings: no conditional validation for
`STORAGE_LOCAL_FS_PATH` when `STORAGE_DRIVER=local`, no `config.spec.ts` for
the Zod schema itself, and the branch mixes 11+ unrelated OIDC/deployment
commits with the GROCERUN-51 config commit.

**Verdict:** 🔁 **Request Changes** — the MEDIUM findings (no injectable
ConfigService, no conditional storage validation, no config tests) should be
addressed before merge. The code is functional and safe, but the ticket
deliverable is not fully met.

---

## Section 2 — Findings

### GROCERUN-51-01 — No @Injectable() ConfigService class
**Severity:** 🟡 MEDIUM
**File:** `apps/server/src/config.ts:59` — `export const env = parsed.data;`
**Track:** A, E

**Problem:** The ticket calls for a "validated ConfigService" — implying a
NestJS `@Injectable()` service class. What's delivered is a module-level
`export const env = parsed.data` singleton imported directly by 6 production
files (`app.module.ts`, `main.ts`, `prisma.service.ts`, `auth.guard.ts`,
`auth.service.ts`, `health.controller.ts`). This bypasses NestJS dependency
injection entirely. The NestJS rules (`wiki/rules/nestjs.md`) mandate
constructor injection for all service dependencies. While the code works
correctly today (tests pass, 125 server + 99 web), it makes config impossible
to mock in tests without module-level mocking, which
`wiki/rules/testing-standards.md` discourages. As more features depend on
config, the inability to inject test-specific config values will force
`process.env` mutation in test setup — exactly the pattern this ticket was
meant to eliminate.

**Fix:** Wrap the env schema in an `@Injectable()` ConfigService class,
register it in a global `ConfigModule`, and inject via constructor in
consumers:

```typescript
@Injectable()
export class ConfigService {
  readonly env: Env;

  constructor() {
    this.env = envSchema.parse(process.env);
  }

  get storageDriver() { return this.env.STORAGE_DRIVER; }
  get storageLocalFsPath() { return this.env.STORAGE_LOCAL_FS_PATH; }
  // ...
}
```

If the module-level singleton is intentionally kept for simplicity (a
defensible choice for a small app), document the decision in an ADR and
update the ticket title to "Validated Config Module" to set expectations.

---

### GROCERUN-51-02 — No conditional validation for STORAGE_LOCAL_FS_PATH
**Severity:** 🟡 MEDIUM
**File:** `apps/server/src/config.ts:33-35`
**Track:** A

**Problem:** `STORAGE_DRIVER` defaults to `'local'` and
`STORAGE_LOCAL_FS_PATH` is `z.string().min(1).optional()`. When
`STORAGE_DRIVER=local`, `STORAGE_LOCAL_FS_PATH` is the filesystem root — it
must be set or the storage driver will fail at runtime with no path. The
schema has a `superRefine` for `OIDC_AUDIENCE` (conditional on `NODE_ENV`)
but none for `STORAGE_LOCAL_FS_PATH` (conditional on `STORAGE_DRIVER`). The
app will boot successfully with an invalid config and only fail when a
storage operation is attempted — the exact "fail at runtime" scenario this
ticket was meant to prevent.

**Fix:** Add a superRefine rule:

```typescript
.superRefine((data, ctx) => {
  if (data.STORAGE_DRIVER === 'local' && !data.STORAGE_LOCAL_FS_PATH) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['STORAGE_LOCAL_FS_PATH'],
      message: 'is required when STORAGE_DRIVER is "local"',
    });
  }
})
```

---

### GROCERUN-51-03 — No tests for config validation
**Severity:** 🟡 MEDIUM
**File:** `apps/server/test/` (no config test file exists)
**Track:** A, D

**Problem:** The Zod env schema has non-trivial validation logic: a
`superRefine` that conditionally requires `OIDC_AUDIENCE` in non-test
environments, enum constraints on `NODE_ENV`/`STORAGE_DRIVER`/`DB_DRIVER`,
coercion on `PORT`, and boot-time fail-fast behavior. No test file exists
for any of this. The testing standards (`wiki/rules/testing-standards.md`)
require unit tests for all non-trivial logic. The `superRefine` branch in
particular is a classic source of regressions — if someone removes or
weakens it, OIDC audience validation silently breaks in production.

**Fix:** Create `apps/server/test/config.spec.ts` covering:
- Valid env passes (all defaults applied correctly)
- Missing `OIDC_AUDIENCE` in `NODE_ENV=prod` fails with clear error
- Missing `OIDC_AUDIENCE` in `NODE_ENV=test` passes
- Invalid `STORAGE_DRIVER` value fails
- Invalid `NODE_ENV` value fails
- Boot-time error message format (field name + message)
- (After GROCERUN-51-02 fix) `STORAGE_DRIVER=local` without
  `STORAGE_LOCAL_FS_PATH` fails

---

### GROCERUN-51-04 — Branch mixes unrelated commits
**Severity:** 🟡 MEDIUM
**File:** N/A (branch `feat/grocerun-51-validated-config`)
**Track:** E

**Problem:** The branch contains 13 commits beyond main, of which only 1
(`eae1bee`) is GROCERUN-51 config work. The remaining 12 commits are
GROCERUN-39/49 (generic OIDC provider), JWKS auto-refresh, Authentik
docker-compose, deployment docs reorganization, scripts cleanup, CodeRabbit
audit fixes, and GROCERUN-14 brainstorm docs. This makes the branch diff
noisy (54 files, +2998/-872) and hard to review — a reviewer must mentally
filter unrelated changes to find the GROCERUN-51 scope. Conventional commit
standards (`wiki/rules/coding-standards.md` — Git Conventions) imply branch
names should reflect their content.

**Fix:** For future branches, split unrelated work into separate branches.
If the OIDC work is already merged or needs to ship together, document the
mixed scope in the PR description. Consider an interactive rebase to
separate the GROCERUN-51 commit into its own branch if the OIDC work hasn't
been reviewed yet.

---

### GROCERUN-51-05 — Misleading comment on DB_DRIVER line
**Severity:** 🟢 LOW
**File:** `apps/server/src/config.ts:30`
**Track:** E

**Problem:** Line 30 comments `// Database driver seam (declared now; driver
logic lands in GROCERUN-53)` on the `DB_DRIVER` line. GROCERUN-53 is the
StorageDriver interface ticket, not a database driver ticket. The comment
conflates the two driver seams and will mislead implementers.

**Fix:** Correct the comment: `// Database driver seam (declared now; no
driver selection logic yet)`.

---

### GROCERUN-51-06 — isGoogleIssuer logic duplicated in vite.config.ts
**Severity:** 🟢 LOW
**File:** `apps/web/vite.config.ts:33` and `apps/web/src/core/auth/oidc-config.ts:42-48`
**Track:** E

**Problem:** The `isGoogle` hostname check in `vite.config.ts:33` duplicates
the `isGoogleIssuer()` function in `oidc-config.ts:42-48`. The vite config
can't import from the web app's `src/` (it's a build-time config), so this
duplication is structurally unavoidable. However, if the Google issuer
hostname ever changes (unlikely but possible), both places need updating.

**Fix:** Extract the hostname constant into a shared location that both
`vite.config.ts` and `oidc-config.ts` can import, or add a comment in
`vite.config.ts` pointing to `oidc-config.ts` as the canonical
implementation.

---

### GROCERUN-51-07 — resolveOidcConfig returns empty string for missing clientId
**Severity:** 🟢 LOW
**File:** `apps/web/src/core/auth/oidc-config.ts:66` — `clientId: merged.clientId ?? ''`
**Track:** A

**Problem:** `ResolvedOidcConfig.clientId` is typed as `string | undefined`
but the actual return value is always a string (`merged.clientId ?? ''`).
When no clientId is configured, the function returns an empty string instead
of `undefined`. This is a minor type inconsistency — the interface claims
`undefined` is possible but the implementation never produces it. Downstream
code checking `if (result.clientId)` would behave differently for `''` vs
`undefined`.

**Fix:** Either return `merged.clientId` (preserving `undefined`) or update
the interface to `clientId: string` and document that missing clientId
returns an empty string.

---

## Section 3 — Priority Action Items

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| 1 | GROCERUN-51-01: No @Injectable() ConfigService | 🟡 MEDIUM | Wrap in @Injectable() class + global module, or document the singleton decision in an ADR |
| 2 | GROCERUN-51-02: No conditional validation for STORAGE_LOCAL_FS_PATH | 🟡 MEDIUM | Add superRefine requiring STORAGE_LOCAL_FS_PATH when STORAGE_DRIVER=local |
| 3 | GROCERUN-51-03: No config tests | 🟡 MEDIUM | Create config.spec.ts covering validation branches and boot-time fail-fast |
| 4 | GROCERUN-51-04: Branch mixes unrelated commits | 🟡 MEDIUM | Split into separate branches or document mixed scope in PR description |

---

## Section 4 — Test Gaps

| Finding | Missing Test Coverage |
|---------|----------------------|
| GROCERUN-51-02 (conditional validation) | No test verifies that `STORAGE_DRIVER=local` without `STORAGE_LOCAL_FS_PATH` fails at boot |
| GROCERUN-51-03 (no config tests) | No test for `OIDC_AUDIENCE` superRefine branch (non-test env requires it, test env exempts) |
| GROCERUN-51-03 (no config tests) | No test for boot-time error message format |
| GROCERUN-51-03 (no config tests) | No test for enum validation on `NODE_ENV`, `STORAGE_DRIVER`, `DB_DRIVER` |
| GROCERUN-51-03 (no config tests) | No test for `PORT` coercion (string → number) |

---

## Section 5 — Positive Notes

- **Zod-first config validation:** The env schema uses Zod with proper
  enums, coercion, defaults, and a superRefine for conditional requirements.
  This is the right approach — fail fast at boot with clear error messages
  rather than failing at runtime with undefined behavior.

- **Sensible defaults:** `NODE_ENV=dev`, `PORT=3001`, `DATABASE_URL=file:dev.db`,
  `STORAGE_DRIVER=local` — all reasonable for local development. A new
  developer can clone and run with zero `.env` configuration.

- **process.loadEnvFile non-override semantics:** The comment on lines 5-6
  correctly documents that `process.loadEnvFile` does NOT override
  already-set variables, ensuring test/CI-injected values always win. This is
  a subtle but important correctness property.

- **.env.example is comprehensive:** Every env var is documented with
  comments explaining its purpose, defaults, and provider-specific guidance
  (Google vs Authentik). The file is a genuine help to new developers.

- **STORAGE_BASE_URL correctly omitted:** The GROCERUN-14 ticket decided to
  drop `STORAGE_BASE_URL` because local URLs are relative. The config.ts
  schema correctly omits it, aligning with the ticket decision.

- **Fail-fast error formatting:** The boot-time error (lines 49-57) formats
  Zod issues into a readable multi-line message with field names, making
  misconfiguration immediately diagnosable.

- **isGoogleIssuer uses URL parsing, not substring:** The `isGoogleIssuer()`
  function correctly uses `new URL(issuerUri).hostname` instead of substring
  matching, preventing spoofed domains like `accounts.google.com.evil.tld`
  from unlocking `__unsafe_*` options. This is a security-conscious
  implementation backed by 5 dedicated test cases.

- **resolveOidcConfig test coverage is thorough:** 15 test cases cover
  Google, non-Google, spoofed domains, missing config, env precedence,
  Authentik, Keycloak, and Google-without-secret scenarios. This is
  exemplary test coverage for a config resolution function.

- **oidc-server.ts JWKS coalescing:** The `refreshInFlight` promise
  coalescing pattern correctly ensures only one JWKS refresh happens when
  multiple concurrent requests fail with kid-missing errors. The test suite
  verifies this with a 7-concurrent-request scenario.

- **auth.service.spec.ts covers all 3 login paths:** 12 tests across 5 groups
  (known account, email linking, unverified email, brand new user, explicit
  provider) with careful attention to the `email_verified === true` guard.
  The upsert-for-race-condition handling in the email-linking path is
  correctly tested.

- **All 224 tests pass:** 125 server + 99 web, no failures, no skips.