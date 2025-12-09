# technical audit results

### 1. Align real-time promise with delivery

- `risk level: medium`
- effort estimation: medium (1-2 days)
- The product is positioned as “real-time” in [README.md#L3-L5](README.md#L3-L5), yet there is no realtime transport or dependency (no websocket/SSE/pusher packages in [package.json#L11-L64](package.json#L11-L64)); current server actions require manual reloads for updates, so either implement an event layer (e.g., SSE/WebSockets) or revise marketing/docs to match behavior.
- reason why this actionable item is relevant: Avoids misleading users and ensures architecture matches stated product value, reducing support churn.

---

### 2. Decide and harden production database target

- `risk level: high`
- effort estimation: medium (2-3 days)
- Deployment uses SQLite via file volume ([docker-compose.prod.yml#L1-L20](docker-compose.prod.yml#L1-L20)) and the Prisma datasource is set to sqlite ([prisma/schema.prisma#L11-L11](prisma/schema.prisma#L11)), which is single-writer and fragile for multi-user/HA; clarify if production should be PostgreSQL and update connection strings, migrations, backup/restore guidance, and README accordingly.
- reason why this actionable item is relevant: Prevents data loss/locking under concurrent writes and aligns infra with expected scale.

---

### 3. Consolidate store access-control helpers

- `risk level: high`
- effort estimation: medium (1-2 days)
- Two different `verifyStoreAccess` implementations exist: boolean-return in [src/lib/auth-helpers.ts#L12-L24](src/lib/auth-helpers.ts#L12-L24) and error-throwing/store-return in [src/lib/store-access.ts#L3-L31](src/lib/store-access.ts#L3-L31); actions import both styles ([src/actions/store.ts#L12-L124](src/actions/store.ts#L12-L124), [src/actions/item.ts#L15-L116](src/actions/item.ts#L15-L116)), risking inconsistent authorization outcomes and error shapes. Unify into a single helper with a clear contract (throw vs return) and update all call sites/tests.
- reason why this actionable item is relevant: Ensures consistent security enforcement and predictable error handling.

---

### 4. Fix cache revalidation target after item updates

- `risk level: medium`
- effort estimation: low (<0.5 day)
- `updateItem` revalidates a literal `/lists/[id]` path instead of the concrete list route, so list pages won’t refresh after edits ([src/actions/item.ts#L19-L53](src/actions/item.ts#L19-L53)); switch to the actual list path (e.g., `/lists/${listId}`) and add coverage for list/item mutations.
- reason why this actionable item is relevant: Prevents stale UI after item edits, reducing user confusion and support tickets.

---

### 5. Promote list status to a Prisma enum

- `risk level: medium`
- effort estimation: low (0.5-1 day)
- List `status` is a free-form string with comments for states ([prisma/schema.prisma#L82-L90](prisma/schema.prisma#L82-L90)), allowing invalid values to slip in; convert to a Prisma enum and propagate types to API/UI to enforce valid transitions.
- reason why this actionable item is relevant: Improves data integrity and type safety for core workflow state.

---

### 6. Correct Next.js route param typing

- `risk level: low`
- effort estimation: low (<0.5 day)
- `ListDetailsPage` types `params` as a `Promise` and awaits it, but Next.js passes a plain object ([src/app/lists/[listId]/page.tsx#L9-L18](src/app/lists/[listId]/page.tsx#L9-L18)); this masks type errors and can hide runtime issues. Type `params` as a sync object and rely on framework typing.
- reason why this actionable item is relevant: Restores type safety and reduces runtime surprises in route handlers.

---

### 7. Remove hidden side effects from store reads

- `risk level: medium`
- effort estimation: medium (1 day)
- `getStores` auto-creates a household when none exists or when an invalid householdId is passed ([src/actions/store.ts#L12-L48](src/actions/store.ts#L12-L48)), causing state changes on read paths; refactor to explicit onboarding/default-household flows and make `getStores` a pure query, returning an empty set or error instead of creating data.
- reason why this actionable item is relevant: Avoids unexpected data creation and keeps reads idempotent, simplifying debugging and auditability.

---

### 8. Add quality gates (tests/CI) and telemetry basics

- `risk level: high`
- effort estimation: medium (2-4 days)
- There are no test or type-check scripts beyond lint in package scripts ([package.json#L5-L9](package.json#L5-L9)), and no observable logging/metrics around server actions; introduce unit/integration smoke tests (auth, household join, list CRUD), add a CI workflow to run lint+typecheck+tests, and instrument server actions with structured logging for error diagnosis.
- reason why this actionable item is relevant: Reduces regression risk and improves operability before production adoption.

---

### 9. Stabilize framework/auth version alignment

- `risk level: medium`
- effort estimation: medium (1-2 days)
- The stack pairs Next 16 with React 19 and a beta NextAuth release ([package.json#L11-L64](package.json#L11-L64)); this combo lacks documented compatibility and can introduce breaking changes. Pin compatible versions or add canary/test coverage to catch framework/auth updates before rollout.
- reason why this actionable item is relevant: Prevents upgrade-induced outages and keeps auth/session flows stable.

---

