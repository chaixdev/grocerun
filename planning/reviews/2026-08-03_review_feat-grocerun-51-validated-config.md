# Review: GROCERUN-51 — Validated ConfigService

**Branch:** `feat/grocerun-51-validated-config`
**Date:** 2026-08-03
**Reviewer:** Deep Reviewer (automated)
**Merge base:** `0a76c38` (tag 1.0.1)

---

## Section 1 — Summary

GROCERUN-51 ("Validated ConfigService") is **not implemented**. The branch
`feat/grocerun-51-validated-config` contains 11 commits of unrelated
auth/OIDC work (GROCERUN-39, GROCERUN-49, JWKS auto-refresh, Authentik
docker-compose, deployment docs reorganization) and zero ConfigService
commits. The only artifact pointing toward GROCERUN-51 is an **untracked**
`apps/server/src/config.ts` file containing a Zod env schema with
`STORAGE_DRIVER` and `STORAGE_LOCAL_FS_PATH` declared but no ConfigService
class, no conditional validation, and no tests. Six production files import
`{ env }` from this untracked file via uncommitted working-tree modifications,
meaning the branch does not build for anyone who clones it. The most
important finding is that the ticket's deliverable — a NestJS injectable
ConfigService — does not exist in any form.

**Verdict:** ❌ **Reject** — the implementation does not exist. The branch is
misnamed and contains unrelated work. GROCERUN-51 needs to be implemented
from scratch on a correctly-named branch.

---

## Section 2 — Findings

### GROCERUN-51-01 — GROCERUN-51 is not implemented
**Severity:** 🔴 CRITICAL
**File:** `apps/server/src/config.ts` (untracked)
**Track:** A, E

**Problem:** The ticket calls for a "validated ConfigService" — a NestJS
injectable service class providing `STORAGE_DRIVER`, `STORAGE_LOCAL_FS_PATH`,
and Zod-validated env var parsing. No ConfigService class exists anywhere in
the codebase. The branch `feat/grocerun-51-validated-config` has 11 commits
beyond main, all of which are auth/OIDC work (GROCERUN-39, GROCERUN-49),
deployment doc reorganization, and scripts cleanup — none of which relate to
GROCERUN-51. The only artifact is an untracked `config.ts` with a partial
Zod env schema that exports `env` as a module-level singleton, not a service.

**Fix:** Implement GROCERUN-51 on a correctly-named branch. Create an
`@Injectable()` ConfigService class that wraps the Zod-validated env schema,
register it as a global module, and inject it via constructor in consumers.
The existing `config.ts` env schema is a reasonable starting point but needs
to be wrapped in a service class.

---

### GROCERUN-51-02 — Branch is misnamed
**Severity:** 🟠 HIGH
**File:** N/A (branch `feat/grocerun-51-validated-config`)
**Track:** E

**Problem:** The branch name `feat/grocerun-51-validated-config` implies it
contains GROCERUN-51 (ConfigService) work. It does not. The 11 committed
changes are for GROCERUN-39/49 (generic OIDC provider support), JWKS
auto-refresh, Authentik docker-compose, and deployment docs reorganization.
This misleads reviewers, CI, and ticket tracking. Conventional commit
standards (`wiki/rules/coding-standards.md` — Git Conventions) require branch
names to reflect their content.

**Fix:** Rename the branch to reflect its actual content (e.g.
`feat/grocerun-39-generic-oidc`) or split the OIDC work into its own branch
and create a new `feat/grocerun-51-validated-config` branch for the
ConfigService implementation.

---

### GROCERUN-51-03 — config.ts is untracked; branch does not build
**Severity:** 🟠 HIGH
**File:** `apps/server/src/config.ts` (untracked, `??` in git status)
**Track:** A, E

**Problem:** `apps/server/src/config.ts` is untracked — it has never been
`git add`ed. Six production files (`prisma.service.ts`, `app.module.ts`,
`main.ts`, `auth.guard.ts`, `health.controller.ts`, `auth.service.ts`) import
`{ env }` from `./config` via **uncommitted** working-tree modifications. If
anyone clones the branch, these imports resolve to a non-existent file and
the project fails to compile. The committed branch HEAD has no reference to
config.ts at all.

**Fix:** Either commit `config.ts` and the consumer modifications (if the
ConfigService work is intended for this branch) or remove the uncommitted
imports from the 6 files (if this branch is only for OIDC work). Do not leave
the working tree in a state where tracked files import from untracked files.

---

### GROCERUN-51-04 — No ConfigService class; module-level singleton instead
**Severity:** 🟡 MEDIUM
**File:** `apps/server/src/config.ts:59` — `export const env = parsed.data;`
**Track:** A, E

**Problem:** The ticket explicitly calls for a "validated ConfigService" —
implying a NestJS `@Injectable()` service class. What exists is a
module-level `export const env = parsed.data` singleton imported directly by
6 files. This bypasses NestJS dependency injection entirely, making the config
impossible to mock in tests without module-level mocking (which
`wiki/rules/testing-standards.md` discourages). The NestJS rules
(`wiki/rules/nestjs.md`) mandate constructor injection for all service
dependencies.

**Fix:** Wrap the env schema in an `@Injectable()` ConfigService class:
```typescript
@Injectable()
export class ConfigService {
  readonly env: Env;
  constructor() { this.env = envSchema.parse(process.env); }
  get storageDriver() { return this.env.STORAGE_DRIVER; }
  get storageLocalFsPath() { return this.env.STORAGE_LOCAL_FS_PATH; }
}
```
Register as a global module and inject via constructor in consumers.

---

### GROCERUN-51-05 — No conditional validation for STORAGE_LOCAL_FS_PATH
**Severity:** 🟡 MEDIUM
**File:** `apps/server/src/config.ts:33-35`
**Track:** A

**Problem:** `STORAGE_DRIVER` defaults to `'local'` and
`STORAGE_LOCAL_FS_PATH` is `z.string().min(1).optional()`. When
`STORAGE_DRIVER=local`, `STORAGE_LOCAL_FS_PATH` is the filesystem root — it
must be set or the storage driver will fail at runtime with no path. The
schema has a `superRefine` for `OIDC_AUDIENCE` (conditional on `NODE_ENV`)
but none for `STORAGE_LOCAL_FS_PATH` (conditional on `STORAGE_DRIVER`). The
app will boot successfully with an invalid config and only fail when a storage
operation is attempted.

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

### GROCERUN-51-06 — No tests for config validation
**Severity:** 🟡 MEDIUM
**File:** `apps/server/test/` (no config test file exists)
**Track:** A, D

**Problem:** The Zod env schema has non-trivial validation logic: a
`superRefine` that conditionally requires `OIDC_AUDIENCE` in non-test
environments, enum constraints on `NODE_ENV`/`STORAGE_DRIVER`/`DB_DRIVER`,
and boot-time fail-fast behavior. No test file exists for any of this. The
testing standards (`wiki/rules/testing-standards.md`) require unit tests for
all non-trivial logic. The `superRefine` branch in particular is a classic
source of regressions — if someone removes or weakens it, OIDC audience
validation silently breaks.

**Fix:** Create `apps/server/test/config.spec.ts` covering:
- Valid env passes (all defaults applied correctly)
- Missing `OIDC_AUDIENCE` in `NODE_ENV=prod` fails with clear error
- Missing `OIDC_AUDIENCE` in `NODE_ENV=test` passes
- Invalid `STORAGE_DRIVER` value fails
- Invalid `NODE_ENV` value fails
- Boot-time error message format (field name + message)

---

### GROCERUN-51-07 — Misleading comment on DB_DRIVER line
**Severity:** 🟢 LOW
**File:** `apps/server/src/config.ts:30`
**Track:** E

**Problem:** Line 30 comments `// Database driver seam (declared now; driver
logic lands in GROCERUN-53)` on the `DB_DRIVER` line. GROCERUN-53 is the
StorageDriver interface ticket, not a database driver ticket. The comment
conflates the two driver seams and will mislead implementers.

**Fix:** Correct the comment to reference the appropriate ticket or remove
the ticket reference: `// Database driver seam (declared now; no driver
selection logic yet)`.

---

## Section 3 — Priority Action Items

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| 1 | GROCERUN-51-01: ConfigService not implemented | 🔴 CRITICAL | Implement ConfigService class from scratch on a correctly-named branch |
| 2 | GROCERUN-51-02: Branch misnamed | 🟠 HIGH | Rename branch or split OIDC work into separate branch |
| 3 | GROCERUN-51-03: config.ts untracked, branch broken | 🟠 HIGH | Commit config.ts or remove uncommitted imports from 6 files |
| 4 | GROCERUN-51-04: Module-level singleton, not injectable | 🟡 MEDIUM | Wrap in @Injectable() ConfigService, register as global module |
| 5 | GROCERUN-51-05: Missing conditional validation | 🟡 MEDIUM | Add superRefine for STORAGE_LOCAL_FS_PATH when STORAGE_DRIVER=local |
| 6 | GROCERUN-51-06: No config tests | 🟡 MEDIUM | Create config.spec.ts covering validation branches |

---

## Section 4 — Test Gaps

| Finding | Missing Test Coverage |
|---------|----------------------|
| GROCERUN-51-01 (ConfigService not implemented) | All — no ConfigService exists to test |
| GROCERUN-51-05 (conditional validation) | No test verifies that `STORAGE_DRIVER=local` without `STORAGE_LOCAL_FS_PATH` fails at boot |
| GROCERUN-51-06 (no config tests) | No test for `OIDC_AUDIENCE` superRefine branch (non-test env requires it, test env exempts) |
| GROCERUN-51-06 (no config tests) | No test for boot-time error message format |
| GROCERUN-51-06 (no config tests) | No test for enum validation on `NODE_ENV`, `STORAGE_DRIVER`, `DB_DRIVER` |

---

## Section 5 — Positive Notes

- **Zod-first config validation:** The env schema uses Zod with proper
  enums, coercion, defaults, and a superRefine for conditional requirements.
  This is the right approach — fail fast at boot with clear error messages
  rather than failing at runtime with undefined behavior.

- **Sensible defaults:** `NODE_ENV=dev`, `PORT=3001`, `DATABASE_URL=file:dev.db`,
  `STORAGE_DRIVER=local` — all reasonable for local development. A new
  developer can clone and run with zero `.env` configuration.

- **process.loadEnvFile non-override semantics:** The comment on line 5-6
  correctly documents that `process.loadEnvFile` does NOT override
  already-set variables, ensuring test/CI-injected values always win. This is
  a subtle but important correctness property.

- **.env.example is comprehensive:** Every env var is documented with
  comments explaining its purpose, defaults, and provider-specific guidance
  (Google vs Authentik). The file is a genuine help to new developers.

- **STORAGE_BASE_URL correctly dropped:** The GROCERUN-14 ticket (line 99)
  decided to drop `STORAGE_BASE_URL` because local URLs are relative. The
  config.ts schema correctly omits it, aligning with the ticket decision.

- **Fail-fast error formatting:** The boot-time error (lines 49-57) formats
  Zod issues into a readable multi-line message with field names, making
  misconfiguration immediately diagnosable.