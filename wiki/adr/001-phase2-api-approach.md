# ADR 001: Phase 2 API Approach - Simple REST over Code Generation

**Status:** Accepted  
**Date:** 2026-01-09  
**Deciders:** Development Team  
**Context:** Phase 2 - API Proxy Layer Migration

---

## Context

During Phase 2 migration (decoupling Next.js Server Actions from direct Prisma calls), we needed to choose an approach for client-server communication between Next.js and NestJS.

**Key Constraints:**
1. Phase 2 is **temporary scaffolding** for Phase 3 (client-side React Query) and Phase 4 (RxDB local-first)
2. Local-first architecture is the end goal: `Component → RxDB (local) ⟷ Background Sync ⟷ NestJS`
3. Phase 2 API layer will be **heavily modified or replaced** when RxDB sync is implemented
4. Need to migrate 38 server actions incrementally with low risk

---

## Decision

**We will use Simple REST APIs with shared Zod schemas** rather than code generation tools (OpenAPI/orval) or type-safe frameworks (ts-rest/tRPC).

### Implementation Approach

```typescript
// apps/web/src/core/lib/api-client.ts
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, options)
  const data = await res.json()
  return schema ? schema.parse(data) : data
}

// Reuse existing Zod schemas for validation
export async function getItems(storeId: string) {
  if (usePrisma.items) {
    return prisma.item.findMany({ where: { storeId }})
  }
  return apiCall(`/items?storeId=${storeId}`, {}, z.array(ItemSchema))
}
```

---

## Options Considered

### Option 1: tRPC ❌
**Pros:** End-to-end type safety, no codegen, excellent DX  
**Cons:** Not REST (RPC over HTTP), incompatible with RxDB sync patterns, overkill for temporary layer

### Option 2: ts-rest ❌
**Pros:** REST APIs with TypeScript contracts, good type safety, no build step  
**Cons:** Additional library, contract maintenance overhead, will be replaced in Phase 4 anyway

### Option 3: OpenAPI + orval/openapi-typescript ❌
**Pros:** Industry standard, tooling ecosystem, external API documentation  
**Cons:** Build step required, verbose NestJS decorators, generated code complexity, too heavy for temporary use

### Option 4: Simple REST + Zod ✅ (Chosen)
**Pros:**
- Minimal investment for temporary scaffolding
- Reuses existing Zod schemas (already in codebase)
- Simple to understand and maintain
- Easy to evolve into RxDB sync endpoints
- No build steps, no new dependencies

**Cons:**
- Manual fetch wrappers
- No automatic type inference for API calls
- Requires discipline to keep schemas in sync

---

## Rationale

### 1. Phase 2 is Temporary
The current API layer is a stepping stone to RxDB local-first architecture. Over-engineering it with sophisticated tooling (ts-rest, OpenAPI generation) creates **technical debt that will be thrown away** in Phase 4.

### 2. RxDB Dictates Final API Shape
RxDB replication plugins have specific patterns for sync:
- Push/pull endpoints with change tracking
- Conflict resolution logic
- Batch operations

Standard CRUD endpoints built in Phase 2 will need **significant redesign** for RxDB compatibility. Keeping Phase 2 simple makes this transition easier.

### 3. Complexity Budget
We have limited development time and complexity budget. Spending it on:
- ❌ Learning ts-rest contract DSL
- ❌ Setting up OpenAPI generation pipelines
- ❌ Maintaining type generation builds

vs.

- ✅ Actually migrating server actions
- ✅ Understanding RxDB sync patterns
- ✅ Building local-first architecture

The choice is clear: **save complexity for where it matters (Phase 4)**.

### 4. Zod is Already There
All server actions already use Zod for validation. Reusing these schemas for API responses provides:
- Runtime validation on both client and server
- Type safety via `z.infer<typeof Schema>`
- Consistent data shapes across the stack

---

## Consequences

### Positive
- ✅ Fast Phase 2 migration (less tooling overhead)
- ✅ Lower learning curve for future developers
- ✅ Easier to evolve APIs for RxDB sync patterns
- ✅ Reduced build complexity (no codegen steps)
- ✅ Clear path from Phase 2 → Phase 3 → Phase 4

### Negative
- ❌ Manual effort to keep client/server schemas aligned
- ❌ No automatic type inference for API calls (rely on Zod parsing)
- ❌ Potential for client-server drift if not disciplined

### Mitigation Strategies
1. **Shared schema location:** Keep Zod schemas in `apps/web/src/core/schemas` (already done)
2. **Runtime validation:** Always parse API responses with Zod on client
3. **Integration tests:** Test API contracts to catch drift
4. **Feature flags:** Easy rollback if API calls break (flip flag to Prisma)

---

## Future Considerations

### Phase 3 (Client-Side Fetching)
Simple REST + Zod integrates cleanly with React Query:
```typescript
const { data } = useQuery({
  queryKey: ['items', storeId],
  queryFn: () => apiCall(`/items?storeId=${storeId}`, {}, ItemsSchema)
})
```

### Phase 4 (RxDB Sync)
Current REST endpoints can evolve to sync endpoints:
```typescript
// Phase 2: Standard CRUD
GET /items?storeId=X

// Phase 4: Change-based sync
GET /items/changes?since=1234567890&storeId=X
POST /items/changes (batch push)
```

No major API redesign required, just endpoint additions.

---

## References

- [Phase 2 Migration Plan](../apps/web/wiki/planning/phase-2-api-proxy.md)
- [RxDB Replication Protocols](https://rxdb.info/replication.html)
- [Project Status](../PROJECT-STATUS.md)

---

**Decision Date:** January 9, 2026  
**Review Date:** Before Phase 4 (RxDB integration)  
**Status:** Active
