# Software Lifecycle Pillars — Evaluation Rubric for Grocerun

Date: 2026-06-22

Scope: evaluation framework for grocerun across the software lifecycle, oriented toward the transition from IC-dev (ops handled by others) to owning deployment and operations on AWS while keeping the self-host community deploy path viable.

Origin: synthesized from a council-style review of the codebase (`main.ts`, `app.module.ts`, `health.controller.ts`, `Dockerfile`, `docker-entrypoint.sh`, `oidc-server.ts`, `production-quality.md`, `coding-standards.md`, `PROJECT-STATUS.md`). Single-model synthesis, not a true multi-model council run — treat findings as one informed perspective, not consensus.

Companion exercise: the owner will work through each pillar separately to convert tacit IC instincts into explicit, owned knowledge. The rubric is the diagnostic; the exercise is the actual work. See "How to use this rubric" at the end.

## Mindset shift

Going from IC-dev to owning ops changes one thing: **in dev you reproduce bugs, in prod you reconstruct them.** Every pillar below is about making that reconstruction possible, cheap, and safe.

The self-host + AWS dual-target creates a specific tension:

> Self-host optimizes for "easy day-1" (one `docker compose up`, auto-migrate). Production operability optimizes for "safe day-N" (rollback, observability, graceful failure). These conflict at the config/seams layer. Resolution: env-driven drivers behind stable interfaces — one image, two deploy targets, same code.

One framing point the owner has internalized: **the gap is execution, not knowledge — but more precisely, the gap is tacit-to-explicit conversion.** Strong standards already exist in `production-quality.md` and `coding-standards.md`, but several were LLM-authored without the conversion happening in the owner's head. That produces documents that look like expertise but aren't backed by internalized understanding. The exercise per pillar is to close that gap; the rubric below is the diagnostic for where to do it.

## The 8-Pillar Rubric

For each pillar: **what it means → why it matters long-term → maturity signals (immature → mature) → grocerun next steps.**

Score each pillar 0–2 against the maturity signals: `0 = immature signals dominate`, `1 = mixed`, `2 = mature signals dominate`. Re-score every quarter. The *trajectory* matters more than the absolute score — a pillar going from 1→2 is more important than one sitting at 2.

### 1. Design / Architecture

**Means:** how the system decomposes; where boundaries live; whether changing one requirement cascades across the codebase. Coupling is the multiplier on every other pillar's cost.

**Why long-term:** bad coupling means a logging change touches 20 files, a Postgres swap touches every service, a "make this S3" change rewrites half the modules. Good seams mean each pillar can be improved independently.

**Maturity signals:**
- *Immature:* shared mutable state across "modules"; env vars read ad-hoc in 6 places; "decoupling" = TODO comments; boundaries exist in folder structure only.
- *Mature:* explicit ports/adapters or config-driven drivers; one config schema validated at boot; boundaries enforced by build (import rules / lint).

**Grocerun next steps:**
1. Build one validated `ConfigService`. `NestConfigModule.forRoot({ isGlobal: true })` is imported in `app.module.ts` but `process.env` is read directly in `main.ts`, `prisma.service.ts`, `app.module.ts`, `health.controller.ts`, and `auth.guard.ts`. The ConfigModule is decorative. Replace with a Zod-validated config object injected everywhere, fail fast at boot if required vars are missing. Prerequisite for the Postgres/MinIO/S3 swap — without it, decoupling is just more `process.env` reads in more places.
2. Define the driver seams now, implement only the local variant. A `StorageDriver` interface (`put`, `get`, `delete`, `url`) with `LocalFsStorageDriver` implemented and `S3StorageDriver` stubbed; same for `DB_DRIVER`. The interface *is* the decoupling — the second implementation can come later. Don't wait until S3 is needed to design the seam; it will be retrofitted badly under pressure.

### 2. Correctness / Quality

**Means:** does the code do what it claims; are invariants enforced; can you change it without fear.

**Why long-term:** in a long-running deploy, bugs don't get caught by "I'm watching dev logs" — they surface days later in prod data, and by then they're data problems, not code problems. Tests + types + validation are the safety net when you're not watching.

**Maturity signals:**
- *Immature:* happy-path tests only; invariants live in comments; types lie (`any`); validation at some boundaries.
- *Mature:* boundary validation everywhere; invariant tests (not just behavior tests); integration against real DB; e2e journeys; CI gates merge.

**Grocerun next steps:**
1. Already genuinely strong — Zod at all boundaries, `strict: true`, 109 tests, Vitest pyramid + Playwright journeys, CI workflows. The gap is invariants documented but not enforced: `AGENTS.md` says "Prisma queries must filter `deleted: false`" and `production-quality.md` says "every list endpoint paginates" — but nothing fails the build if you forget.
2. Add two CI-enforced checks: (a) a lint/test rule flagging Prisma `findMany`/`findFirst` calls whose `where` lacks `deleted` on soft-delete models (the #1 invariant); (b) a test asserting every `@Get()` collection controller accepts a pagination DTO. A standard not enforced by CI degrades to a suggestion.

### 3. Security

**Means:** confidentiality, integrity, authn/authz, secret management, attack surface. For self-host software this is doubled: it runs on *other people's* networks with your name on it, and on AWS it's internet-exposed.

**Why long-term:** a vuln in self-host community software is a trust problem for the whole project, not just your deploy. And AWS exposure moves you from "behind a home NAT" to "scanned within minutes."

**Maturity signals:**
- *Immature:* secrets in repo/images; client secret reaches browser; authn-only (no authz); no rate limiting; unvalidated redirects; no dep scanning.
- *Mature:* secrets only in env/secret manager; least-privilege authz on every endpoint; rate limiting; security headers; dependency scanning; threat model written down.

**Grocerun next steps:**
1. ⚠️ **Verify the client-secret flow before AWS exposure.** `scripts/docker-entrypoint.sh` (lines 97-104) writes `clientSecret` into `config.js`, which is served statically to the browser as `window.__GROCERUN_CONFIG__`. If grocerun uses a PKCE public-client flow (which `oidc-spa` typically does for SPAs), **no secret should ever reach the browser** — a public client has no secret by definition. If `oidc-spa` does a server-side token exchange, the secret must stay server-side only and never appear in `window`. This is the single highest-priority item in this whole rubric. Confirm by loading the deployed app and checking whether `config.js` contains a real secret value; if it does, move the exchange fully behind the NestJS API.
2. Add `@nestjs/throttler` on auth + token + sync endpoints before going to AWS. Sync push/pull endpoints are an easy DoS vector. Also add security headers (helmet equivalent) — the SPA is served by the same process so this is a one-liner in `main.ts`.

### 4. Observability (logging / metrics / tracing) — owner-stated gap

**Means:** can you answer "what happened, why, and since when" without SSHing in and tailing a file. Three signals: **logs** (discrete events), **metrics** (aggregates over time — rate/error/duration), **traces** (one request's path across boundaries).

**Why long-term:** this is *the* pillar that changes when you move from dev to ops. In dev you reproduce. In prod you reconstruct — from telemetry, after the fact, often at 2am. Without it you're blind during incidents and you ship the same bug twice because you can't tell it's the same bug.

**Maturity signals:**
- *Immature:* printf logs (`logger.log("created " + id)`); no link between a request and its logs; debugging = `kubectl logs | grep`; log volume unmanaged; "error" used for client 400s.
- *Mature:* structured JSON logs with `event`/entityId/userId/`correlationId`; severity taxonomy honored (`error` = system, `warn` = degraded/client); RED metrics (Rate/Errors/Duration) per endpoint; traces across service boundaries; alerts on SLO burn, not raw error counts.

**Grocerun reality check:** `production-quality.md` §2 is a *good* standard (structured logging, correlation IDs, severity taxonomy, what to instrument). But `main.ts` line 48 is `httpLogger.log(\`${req.method} ${req.path} ${res.statusCode} ${duration}ms\`)` — pure printf. Only 4 files use `Logger`. No correlation IDs. No metrics. No tracing. The spec and the code disagree.

**Grocerun next steps (do these two before anything else observability — they're the foundation):**
1. Swap the NestJS default Logger for `nest-pino`. One registration in `main.ts` and every existing `this.logger.log(...)` call starts emitting JSON to stdout. Pino is the lowest-friction path in the NestJS ecosystem and it's fast enough that you won't regret it at scale. Self-host sinks it via `docker logs`/journald; AWS sinks it via fluent-bit sidecar or OTel collector → CloudWatch. **Same logs, different sink — env-driven.**
2. Add a `CorrelationIdInterceptor` that reads `X-Correlation-Id` (or generates a UUID), attaches it to every log line for the request's lifetime, and echoes it back in the response header. On the client, have the API client generate one per page load and send it on every request. This single interceptor turns "I see an error in the logs" into "I see the full request path for that error" — it's the highest leverage:effort ratio change in this whole list.

Metrics/tracing come *after* these two. Don't instrument metrics until logs are structured and correlated, or you'll build dashboards on numbers you can't debug.

### 5. Deployability / Operability

**Means:** how easy + safe it is to get running (day-1) and to keep running (day-N: upgrades, rollbacks, config changes, backups, restores).

**Why long-term:** self-host community judges you on this above all else. A 5-step deploy with manual DB edits loses users; `docker compose up` with auto-migrate + auto-backup wins them. On AWS, operability = "can I deploy at 2am without breaking prod."

**Maturity signals:**
- *Immature:* manual migration steps; no backup; config via editing files; no health check; upgrade = "read release notes carefully."
- *Mature:* one-command deploy; migrations auto + safe; backups automatic + *tested*; health split (live vs ready); rollback = a tag change; config via env only.

**Grocerun next steps:** Genuinely above-average here. Multi-stage Dockerfile, non-root user (`grocerun:1001`), `HEALTHCHECK`, and `docker-entrypoint.sh` auto-backs-up (md5 dedup, rotate 5) before running `prisma migrate deploy`. That's solid self-host operability. Two gaps:
1. Split `/health` into `/health/live` and `/health/ready`. Current endpoint returns a static `{status:'ok'}` with no DB probe. Live = "process is up" (cheap, always 200 once booted). Ready = "I can serve real requests" — run `SELECT 1` via Prisma, fail if it errors or migrations are unapplied. Orchestrators (ECS, k8s, even Docker Compose `depends_on: condition: healthy`) need this distinction to avoid routing traffic to a container that's up but not ready.
2. Document the driver-switch matrix as a first-class deploy contract: `DB_DRIVER=sqlite|postgres`, `STORAGE_DRIVER=local|s3`. One image, two deploy targets. This is the artifact that makes the dual-target goal real and reviewable.

### 6. Reliability / Resilience

**Means:** how the system behaves when things *partially* fail — slow deps, rate limits, DNS hiccups, cold starts, partial outages. Code that assumes success cascades into outages.

**Why long-term:** in dev, deps are up and fast. In prod (especially AWS managed services), you hit limits and transient failures constantly. Unbounded waits exhaust pools; blocking on non-critical deps takes down the whole app; no graceful shutdown drops in-flight requests on every deploy.

**Maturity signals:**
- *Immature:* no timeouts; retries without backoff; blocking on non-critical deps; one slow request exhausts the pool; SIGTERM kills in-flight work.
- *Mature:* every outbound call has a timeout; retries idempotent + backoff + jitter; non-critical work fire-and-forget/queued; graceful shutdown drains in-flight; circuit breakers on chatty deps.

**Grocerun next steps:**
1. Add graceful shutdown. Call `app.enableShutdownHooks()` in `main.ts` and handle SIGTERM to stop accepting connections and drain in-flight requests. Without this, every deploy/restart on an orchestrator drops in-flight sync pushes and SSE connections hard. RxDB will retry, but clean drains are cheaper than client-side reconciliation.
2. Add a timeout to the OIDC metadata fetch in `bootstrapAuth` (`main.ts` line 21). Currently a slow/hung IdP hangs startup forever. Wrap with `AbortSignal.timeout(5_000)` and fail fast — the orchestrator will kill+restart you, which is the correct behavior, but fast-fail gives cleaner logs than a hung boot. `production-quality.md` §3.2 mandates this; it's just not implemented at the most critical call site.

### 7. Data / State Management

**Means:** where state lives, how it's persisted, backed up, migrated, and kept consistent — *across the local-first + server split*. State exists in 3 places for grocerun: RxDB (IndexedDB), server DB, backups.

**Why long-term:** data is the only thing you can't redeploy. Every other pillar is "fix code and ship"; data mistakes need migrations or are permanent. Local-first adds an axis: sync must keep RxDB and server consistent, and a backup that doesn't match the server schema is worthless.

**Maturity signals:**
- *Immature:* no backups; migrations by hand; no DB constraints; client/server schema drift; no retention plan.
- *Mature:* automated + *restore-drilled* backups; versioned migrations; constraints at DB level; schema from one source; growth bounded (retention, tombstone cleanup).

**Grocerun next steps:**
1. Design the Postgres backup story *before* flipping `DB_DRIVER=postgres`. Current backup (`docker-entrypoint.sh` §2) is a SQLite file-copy — correct for SQLite, but it silently stops being meaningful the moment you switch to Postgres (copying a live PG data dir is not a safe backup). There will be *no working backup* between the switch and whenever you notice. Plan `pg_dump` cron or RDS automated backups as part of the driver implementation, not as an afterthought.
2. Add a scheduled tombstone cleanup. Soft-delete is on all models (good), but tombstones grow forever. Per `production-quality.md` §1.4, this is a scheduled job, not a per-request op. A daily cron that hard-deletes rows where `deleted = true AND deletedAt < now() - 90d` bounds growth. Document the retention window so self-hosters can tune it.

### 8. Evolution / Maintainability

**Means:** can the code + docs + decisions be understood and changed 6 months / 2 years later, by you or a stranger.

**Why long-term:** the dominant cost of any living software is change, not initial build. Code you can't reason about can't be safely evolved — and evolution is the *whole point* of the decoupling work.

**Maturity signals:**
- *Immature:* no record of why decisions were made; tribal knowledge in your head; rules written but not enforced; big-bang rewrites.
- *Mature:* ADRs for significant decisions; standards enforced by lint/CI; incremental migrations with working app at every step; runbooks for ops tasks; clear doc promotion path.

**Grocerun next steps:** This is the *strongest* pillar — ADRs 001-008, `coding-standards.md` + `production-quality.md` + `testing-standards.md`, the explicit "evolutive over rewrite" choice, audits with severity tracking, `AGENTS.md` routing, and a documented promotion path (`brainstorm → ticket → wiki`). Senior-level discipline. The one gap:
1. Write a runbook (`wiki/development/runbook.md`) for the ops tasks about to be learned the hard way: *deploy, rollback, restore a backup, rotate a secret, debug a stuck sync, restart without losing in-flight work.* Write it once and thank yourself every incident. A runbook is the artifact that turns "I figured it out once" into "anyone can do it" — and for self-host software, it's also user documentation.
2. Promote the top 5 standards into CI checks (overlaps with pillar 2). A standard a human has to remember is a standard that erodes. The ADRs are great; the rules are great; the enforcement is the missing third leg.

## Current scoring (snapshot, 2026-06-22)

| Pillar | Score | Note |
|---|---|---|
| Design/Architecture | 1 | Good boundaries, but ConfigModule is decorative; driver seams not yet cut |
| Correctness/Quality | 2 | Strong — only gap is CI-enforcement of invariants |
| Security | 1 | Authn/authz decent; **client-secret flow needs verification**; no throttling |
| Observability | 0 | Spec is good, implementation is printf + no correlation + no metrics |
| Deployability/Operability | 2 | Above average for self-host; needs live/ready split |
| Reliability/Resilience | 1 | Doc good; no graceful shutdown, no OIDC timeout |
| Data/State | 1 | SQLite backup good; Postgres backup unplanned; no tombstone cleanup |
| Evolution/Maintainability | 2 | Strongest; needs runbook + CI enforcement |

## Prioritized roadmap (ordered by leverage × risk)

1. **Verify client-secret flow** (Security) — hours, highest risk reduction before AWS. *Do this first.*
2. **`nest-pino` + `CorrelationIdInterceptor`** (Observability) — 1–2 days, foundation everything else builds on. Directly fixes the owner-identified gap.
3. **Validated `ConfigService` replacing scattered `process.env`** (Architecture) — 1 day, unblocks the entire Postgres/MinIO decoupling.
4. **`/health/live` + `/health/ready` split** (Operability) — half day, needed for any orchestrator.
5. **Driver seams: `DB_DRIVER` + `STORAGE_DRIVER` interfaces** (Architecture/Data) — design + implement local, stub PG/S3. This *is* the decoupling.
6. **Graceful shutdown + OIDC fetch timeout** (Reliability) — half day.
7. **Postgres backup story** (Data) — design now, before you need it.
8. **CI-enforce top 5 standards + write runbook** (Evolution) — ongoing.

## How to use this rubric (the actual exercise)

Don't use the rubric as a checklist to implement. Use it as a **diagnostic for your own knowledge gaps.** For each pillar, ask: *Can I explain, in my own words, without looking at any doc, what mature looks like and why? Can I name the trade-off?*

Where you can — that's owned knowledge, go implement.
Where you can't — that's where instinct is tacit and needs formalization. **That's more important than any single implementation task.** Implementing `nest-pino` without understanding *why* structured logs matter just gives you borrowed infrastructure on top of borrowed knowledge.

### Method per pillar

1. When you feel "this is wrong" — don't reach for the LLM to tell you why. Sit with it. Write down what you think the problem is, in your own words, even if rough and wrong. The roughness is the point — it surfaces what you actually know vs. what you're guessing.
2. **Then** use the LLM as a Socratic partner, not an author: "Here's what I think the issue is. Interrogate me. Ask me questions. Find the holes." Not "write me a standards doc."
3. Iterate until you can articulate three things in your own words: **the principle, the trade-off it resolves, and when it doesn't apply.** The third one is the test — if you can't name when the rule breaks, you don't own it.
4. *Then* write it down. The doc is the **artifact** of understanding, not the source of it.

### On the logging intuition specifically

The owner's logging approach is flawed — but not for the obvious reason. The flaw isn't that `Logger.log` was used with strings; it's that **logs without correlation and logs without metrics mean you can't reconstruct incidents.** A printf log tells you *something happened*; a structured log with a correlation ID tells you *what happened to this specific user's request, in order, across services*. That's the difference between "I think the sync is broken" and "sync push #a3f2 for user U123 failed at the shopping-lock check at 14:02:33 because list L456 was locked to U789." `production-quality.md` §2 already states that standard — the work is just making `main.ts` match it, and `nest-pino` + one interceptor gets you 80% of the way in a day. But before implementing, do the exercise: write down, in your own words, what good logging is and why. Then come back and interrogate it.

## Open questions for the per-pillar exercise

- [ ] Pillar 1 — Can I explain, without the doc, when a driver seam is worth designing ahead vs. when it's premature abstraction? What's the trade-off for grocerun's self-host + AWS dual-target?
- [ ] Pillar 2 — Can I articulate why CI-enforced invariants are more durable than documented ones? When is a lint rule the wrong tool?
- [ ] Pillar 3 — Can I explain the PKCE public-client flow in my own words and why a public client has no secret? If not, I don't own the security finding above.
- [ ] Pillar 4 — Can I explain, without the doc, why correlation IDs matter, why structured beats printf, why "error" for client 400s is wrong? What's the trade-off (log volume, cognitive load)?
- [ ] Pillar 5 — Can I explain why live vs. ready probes are split? What happens if you collapse them?
- [ ] Pillar 6 — Can I articulate why graceful shutdown matters for local-first sync specifically? When is a hard restart actually fine?
- [ ] Pillar 7 — Can I explain why a SQLite file-copy backup is invalid for Postgres without looking it up? What's the general principle about backup correctness across engines?
- [ ] Pillar 8 — Can I articulate why a runbook is different from a standards doc? When does a runbook become theater?

## Follow-ups

- Per-pillar exercise notes will be appended to this file or split into `2026-06-22_pillar-N-<slug>.md` companions as they're written.
- Re-score the table quarterly; track trajectory.
- After the client-secret flow verification (roadmap item 1), update the Security score and record the finding as an ADR if the flow changes.
