# ADR 010: Validated Config Module — Module Singleton, Not Nest DI

**Status:** Accepted
**Date:** 2026-08-03
**Deciders:** Development Team
**Context:** GROCERUN-51 — replace scattered `process.env` reads with validated configuration

---

## Context

Before GROCERUN-51, environment variables were read directly via `process.env` at
six call sites across the server (`main.ts`, `app.module.ts`, `prisma.service.ts`,
`auth.guard.ts`, `auth.service.ts`, `health.controller.ts`), with `dotenv` and
`@nestjs/config` in the dependency tree. Consequences:

- A typo or missing variable failed only at first use, often deep inside a request
  handler, not at boot.
- Values were untyped strings; consumers hand-coerced and hand-defaulted.
- There was no single, auditable list of what the server needs at runtime.

[NestJS conventions](../rules/nestjs.md) mandate explicit constructor injection for
dependencies. The review of GROCERUN-51 flagged the deliverable's design choice —
a module-level singleton `export const env` rather than an `@Injectable()`
`ConfigService` — as a deviation from that norm, and asked for a decision.

---

## Decision

We keep a **module-level validated config singleton** in
`apps/server/src/config.ts`:

- A Zod schema (`envSchema`) declares every variable with a safe default or
  `optional()`.
- A `superRefine` rule makes `OIDC_AUDIENCE` **required in all non-test
  environments** (`NODE_ENV !== 'test'`).
- The module parses `process.env` (guarded `process.loadEnvFile` first), and on
  failure throws a boot-time error listing each offending field and message via
  `formatEnvIssues`.
- The validated object is exported as `export const env` and imported by consumers.
- `envSchema` and `formatEnvIssues` are exported so the schema and the boot error
  format are unit-testable hermetically (`test/config.spec.ts`).

This is a **documented deviation** from the constructor-injection convention, and
it is deliberate. The singleton pattern applies only to configuration; DI-managed
services continue to use constructor injection.

### Why the singleton is the right shape here

1. **Pre-DI bootstrap is structural.** `main.ts` needs `PORT` before
   `NestFactory.create()` runs, and `app.module.ts` needs `SPA_DIST_DIR` while the
   `@Module()` decorator is still being evaluated. No injectable exists at those
   points, so a purely DI-based config cannot cover the two earliest readers.
   The only real options are a module singleton, or a singleton-plus-injectable
   hybrid.
2. **Fail-fast at import is stronger than DI-time validation.** Config errors
   surface on the first import — at process start — with every bad field listed.
3. **Zero new dependencies.** `@nestjs/config` and `dotenv` were removed; Zod was
   already in the monorepo.
4. **Testable without a DI harness.** The schema and formatter are unit-tested on
   plain objects. Consumers that need variation take explicit parameters
   (e.g. `resolveOidcUser(payload, provider)`), so tests never mutate `process.env`
   or need `overrideProvider`.

---

## Consequences

### Benefits

- A single validated, typed surface for the server's runtime configuration.
- Boot-time failure with a readable, field-by-field error message.
- `OIDC_AUDIENCE` cannot be silently omitted from a production deployment.
- No config framework dependency; the schema is the documentation.
- Config schema and error format are covered by unit tests.

### Costs / risks

- Configuration bypasses Nest DI, deviating from `nestjs.md`. The deviation is
  scoped to config only and justified above.
- Re-reading or varying config at runtime (per-test, per-request, or per-tenant)
  is not possible through DI. Currently unnecessary; if that pressure appears,
  revisit.
- Reviewers must know this ADR exists, or the pattern will keep being flagged.

### Mitigations

- This ADR records the decision and rationale so the pattern is not re-litigated
  as an accident.
- `envSchema` / `formatEnvIssues` are exported and tested, keeping the singleton
  verifiable.
- Services that consume config through the normal NestJS lifecycle remain
  constructor-injected.

---

## Alternatives considered

### `@nestjs/config` `ConfigModule` (rejected)

Adds a dependency and still leaves typed access and validation to application
code, while remaining unavailable at the pre-bootstrap read points in `main.ts`
and `app.module.ts`.

### Singleton + `@Injectable()` `ConfigService` hybrid (rejected for now)

Would satisfy the letter of the constructor-injection norm for injected consumers,
but `main.ts` and `app.module.ts` must still read the singleton before DI exists.
It adds a module plus constructor injections across consumers with no functional
gain, and introduces two config access patterns instead of one. Revisit if
per-test `overrideProvider` pressure or runtime-variable config becomes real.

### Keep raw `process.env` reads (rejected)

This is the pre-change state: untyped, default-free, late-failing, and
undocumented.

---

## Rules for future work

- New environment variables must be added to `envSchema` **and** `.env.example`,
  with a safe default unless the variable is genuinely optional.
- Consumers import `{ env }` from `src/config.ts`; never read `process.env`
  directly.
- `OIDC_AUDIENCE` remains required in every non-test environment.
- If config ever needs to be read at runtime, varied per test, or scoped per
  tenant, revisit this ADR and the hybrid option.

---

## References

- [NestJS conventions](../rules/nestjs.md) — the constructor-injection norm this ADR scopes a deviation from
- `apps/server/src/config.ts` — the validated config module
- `apps/server/test/config.spec.ts` — schema + formatter unit tests
- [GROCERUN-51 review](../../planning/reviews/2026-08-03_review_feat-grocerun-51-validated-config.md) — finding GROCERUN-51-01 raised this question
