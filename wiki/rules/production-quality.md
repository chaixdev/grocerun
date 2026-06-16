# Production Quality

**Status:** Established
**Category:** Universal / Cross-Cutting
**Context:** TypeScript/Node/React/NestJS projects

Rules that prevent the most expensive bugs — the ones you can't fix with a
code change alone because they require data migrations, architectural rewrites,
or an incident postmortem.

---

## 1. Performance

### 1.1 N+1 Query Prevention

Every Prisma query returning multiple rows must consider the N+1 problem.
If a query is followed by per-row subqueries, batch the subquery or use
`include` at the parent level.

**Correct:**
```typescript
// Single query with include — 2 queries total, regardless of result count.
const lists = await prisma.list.findMany({
  where: { householdId, deleted: false },
  include: { items: { where: { deleted: false } } },
});
```

**Incorrect:**
```typescript
// One query per list — 1 + N queries.
const lists = await prisma.list.findMany({ where: { householdId, deleted: false } });
for (const list of lists) {
  list.items = await prisma.listItem.findMany({ where: { listId: list.id, deleted: false } });
}
```

Rule: if you write `await` inside a `for`/`forEach` against query results,
you have an N+1 bug. Refactor to a single batched query.

### 1.2 Pagination Is Mandatory for List Endpoints

Every endpoint returning a collection must paginate. Use cursor-based
pagination (`before`/`after` with `take`) for stable iteration.
Offset-based (`skip`/`take`) is acceptable for admin UIs where cursor
stability isn't required.

**Correct:**
```typescript
@Get()
async findAll(@Query() query: PaginationDto) {
  // PaginationDto: { after?: string; before?: string; take?: number; }
  const { after, before, take = 20 } = query;
  const items = await this.service.findMany({ after, before, take: Math.min(take, 100) });
  return items;
}
```

**Incorrect:**
```typescript
@Get()
async findAll() {
  return this.prisma.list.findMany({ where: { deleted: false } });
  // Unbounded — returns everything. Will time out at scale.
}
```

- Default page size: 20. Maximum page size: 100. Enforced in the DTO.
- Never return unbounded collections from any API endpoint.

### 1.3 Frontend Bundle Size

- Page-level code splitting (`React.lazy` + `Suspense`) for routes outside
  the primary navigation flow.
- Vendor chunk stays under 200 KB gzipped. Audit with `npm run build`
  bundle analyzer before adding new dependencies.
- Images use Next.js `<Image>` or `<picture>` with responsive `srcSet`.
  No full-resolution images in list views.
- Restrict new dependencies: prefer 5 KB over 50 KB. Check bundle impact
  before installing.

### 1.4 Heavy Work Off the Critical Path

Operations that take >1 second or touch external services must not block
the request-response cycle:

- **Fire-and-forget:** SSE broadcasts, analytics, non-critical notifications
  (log failures, don't throw).
- **Queued:** Email sending, PDF generation, 3rd-party sync — use BullMQ
  or equivalent, never in-process.
- **Scheduled:** Batch processing, cleanup — cron jobs, not per-request.

---

## 2. Observability

### 2.1 Structured Logging

All server logs must be structured — emit JSON, not printf-style strings.
Use NestJS `Logger` with context tags.

**Correct:**
```typescript
this.logger.log({
  event: "list.created",
  listId: list.id,
  householdId: list.householdId,
  userId: user.id,
}, ListsService.name);
```

**Incorrect:**
```typescript
this.logger.log(`List ${list.id} created by user ${user.id} in household ${list.householdId}`);
// Free-text log — unsearchable, unparseable, inconsistent format.
```

- Log statements are key-value objects, not concatenated strings.
- Every log entry includes at minimum: `event` (what happened), the
  affected entity ID, and the acting user ID.

### 2.2 Correlation IDs

Every request must carry a traceable identifier from client to server to
database query logs.

- **Client:** Generate a UUID on page load. Attach as `X-Correlation-Id`
  header to every API request via the shared API client.
- **Server:** Extract from headers in a NestJS interceptor. Inject into
  all log statements for the request's lifetime.
- **Database:** Pass correlation ID as a query comment where the driver
  supports it, so slow-query logs can be traced to originating requests.

One implementation per app — interceptors on the server, request wrapper
on the client. No per-endpoint instrumentation.

### 2.3 Error Severity Taxonomy

| Severity | Meaning | Examples | Response |
|----------|---------|----------|----------|
| `CRITICAL` | Data loss or corruption risk | Failed cascade delete, payment double-charge | Page on-call immediately |
| `ERROR` | Operation failed, needs attention | Payment declined, external API down | Alert if >1% error rate over 5 min |
| `WARN` | Degraded but non-blocking | Rate limit hit, stale cache served, retry succeeded | Aggregate in dashboard |
| `INFO` | Normal business event | Entity created, user logged in, order placed | Dashboard metrics only |

- `warn` is for something that needs a human to look eventually.
  `error` is for something that needs a human to look now.
- Never log at `error` for client mistakes (400s, validation failures) —
  those are `warn` at most.
- Every `error` log must include a stack trace and the correlation ID.

### 2.4 What to Instrument

- **Request duration:** Every API endpoint — P50, P95, P99 via histogram.
- **Error rate:** By endpoint and by error class.
- **Database query duration:** Slow queries (>100ms) logged at `warn` with
  the full query and correlation ID.
- **External API call duration and success rate:** Every outbound call to a
  third-party service.
- **RxDB replication:** Sync duration, conflict count, failure rate.
- **Shopping lock acquisition:** Success rate and contention count.

Namespacing: `grocerun.<layer>.<metric>` — e.g., `grocerun.api.lists_create.duration`,
`grocerun.db.query.slow`, `grocerun.sync.rxdb_push.failures`.

---

## 3. Reliability

### 3.1 Idempotency

Every mutation endpoint that could be retried (network failures, client
retry logic) must be idempotent.

- **POST /api/payments:** Use an idempotency key (`Idempotency-Key` header).
  Store the key → response mapping. Return the stored response on replay.
- **PUT operations:** Naturally idempotent — use the entity ID as the
  idempotency key.
- **RxDB push handlers:** Already idempotent by design (document ID + revision).
  Verify this holds for any new push handler.

**Anti-pattern:** A POST endpoint that creates a new entity on every call
with no deduplication. A retried request creates duplicates.

### 3.2 Timeouts

Every outbound call must have an explicit timeout:

```typescript
// External API call — never unbounded.
const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });

// Prisma queries already have a connection timeout, but for long-running
// reports or batch operations, add an application-level timeout.
await Promise.race([
  longRunningQuery(),
  new Promise((_, reject) => setTimeout(() => reject(new Error("Query timeout")), 30_000)),
]);
```

- External HTTP calls: 5 seconds default. Override only with documented reason.
- Database queries: Rely on Prisma connection timeout for CRUD. Batch/report
  queries need explicit 30s application timeout.
- No infinite waits anywhere — every `await` on an external resource has a
  timeout path.

### 3.3 Graceful Degradation

When a dependency is unavailable, the system degrades, it doesn't crash:

- **SSE unavailable:** Client falls back to polling (already implemented
  in RxDB pull replication).
- **Payment gateway down:** Queue the payment intent, show "processing"
  to user, retry with exponential backoff. Never show a 500 page.
- **Optional service down:** Log at `warn`, continue serving. Non-critical
  features (analytics, notifications) must not take down the app.

**Anti-pattern:**
```typescript
const analytics = await analyticsService.track(event);
// If analytics is down, the entire request fails. Analytics is not critical.
```

**Correct:**
```typescript
analyticsService.track(event).catch((err) =>
  this.logger.warn({ event: "analytics.track.failed", error: err.message })
);
// Fire-and-forget. Failure is logged but doesn't block the response.
```

### 3.4 Retry Strategy

Retry only idempotent operations. Use exponential backoff with jitter:

| Attempt | Delay |
|---------|-------|
| 1st retry | 1s + jitter |
| 2nd retry | 2s + jitter |
| 3rd retry | 4s + jitter |
| Give up | Log at `error`, surface to user |

- Maximum 3 retries. After 3 failures, give up and surface the error.
- Retry only on transient errors (5xx, network timeouts, 429 rate limits).
  Never retry on 4xx errors (the request is wrong; retrying won't fix it).
- RxDB push: handled by RxDB's built-in retry. Don't add another layer.

---

## 4. Anti-Patterns

| Pattern | Problem | Do Instead |
|---------|---------|------------|
| `await` inside `for`/`forEach` over query results | N+1 query storm | Batch query: single `findMany` with `include` |
| Unbounded list endpoint | Memory exhaustion, timeouts | Cursor pagination, max page size 100 |
| Free-text log messages | Unsearchable, inconsistent format | Structured JSON with `event` key |
| Logging at `error` for validation failures | Noise that desensitizes on-call | `warn` for client errors, `error` for system failures |
| Blocking on external services in request path | Cascading failure when dependency is down | Fire-and-forget or queue |
| No timeout on external calls | Hung request, thread pool exhaustion | Explicit timeout, max 5s default |
| Non-idempotent mutation endpoints | Duplicate entities on retry | Idempotency key or PUT semantics |
| Retrying non-idempotent operations | Duplicate side effects | Only retry idempotent operations |
| Loading full-resolution images in list views | Slow LCP, wasted bandwidth | Responsive images, `srcSet`, lazy loading |

---

## 5. Implementation Rules

1. Every list endpoint has pagination — no unbounded `findMany` returns
2. No `await` inside a loop over query results — uses batched queries
3. All log statements are structured JSON with `event`, entity ID, and user ID
4. Every outbound HTTP call has an explicit timeout (default 5s)
5. Mutation endpoints that can be retried are idempotent
6. Non-critical external calls are fire-and-forget, never blocking
7. Error severity follows the taxonomy: `error` = system failure, `warn` = degraded/client error
8. New dependencies are reviewed for bundle size impact before install
9. Images in list views use responsive sizing, not full resolution
10. Retries use exponential backoff, max 3 attempts, only on transient errors

---

## Related Documents

| File | Scope |
|------|-------|
| [coding-standards.md](./coding-standards.md) | TypeScript idioms, error handling, git |
| [testing-standards.md](./testing-standards.md) | Test pyramid, integration tests |
| [ci-guardrails.md](./ci-guardrails.md) | Automated enforcement of these rules |
