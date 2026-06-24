# ADR 002: Evolutive Architecture Migration Strategy

**Status:** Accepted  
**Date:** 2025-12-20  
**Deciders:** Development Team  
**Context:** Grocerun modernization and local-first transformation

---

## Context

Grocerun needed to evolve from a traditional monolithic Next.js app with direct database access to a local-first application using RxDB. The scope included:
- Separating frontend and backend concerns
- Enabling offline-first functionality
- Maintaining real-time multi-user collaboration
- Supporting future scalability

Two primary approaches were considered:
1. **Ground-up rewrite**: Build new architecture from scratch, migrate data/users at cutover
2. **Evolutive migration**: Incrementally transform existing app through phased approach

---

## Decision

**We will use an evolutive (incremental) migration strategy** consisting of 4 distinct phases, with the application remaining functional and deployable at each step.

### Migration Phases

```
Phase 1: Monorepo Foundation
├─> Phase 2: API Proxy Layer
    ├─> Phase 3: Client-Side Fetching
        └─> Phase 4: RxDB Integration (Local-First)
```

Each phase has clear completion criteria and builds upon the previous phase's infrastructure.

---

## Options Considered

### Option 1: Ground-Up Rewrite ❌
**Approach:** Build new RxDB-based app in parallel, migrate users at launch

**Pros:**
- Clean architecture from day 1
- No technical debt from old code
- Optimal RxDB integration patterns

**Cons:**
- ⛔ Months of development before any value delivered
- ⛔ Risky "big bang" cutover with potential data migration issues
- ⛔ Opportunity cost: no feature development during rewrite
- ⛔ Unknown unknowns discovered too late
- ⛔ Two codebases to maintain during transition
- ⛔ Users must migrate manually or via forced upgrade

### Option 2: Evolutive Migration ✅ (Chosen)
**Approach:** Transform existing app through 4 incremental phases

**Pros:**
- ✅ App stays functional at every step
- ✅ Learn and adapt during migration
- ✅ Continuous user value delivery
- ✅ Lower risk per step
- ✅ Can pause/pivot if needed
- ✅ Each phase independently useful
- ✅ Users automatically upgraded

**Cons:**
- More complex migration coordination
- Temporary scaffolding code (Phase 2 APIs will be refactored in Phase 4)
- Requires discipline to maintain architecture vision

---

## Rationale

### 1. Risk Management
**Big bang rewrites fail at alarming rates** (see: Netscape, Basecamp's failed rewrite attempts).

Evolutive approach mitigates risk through:
- **Small scope per phase**: Each phase is 10-20 hours of work, not months
- **Continuous validation**: Every phase ends with working software
- **Early learning**: Discover RxDB gotchas in Phase 3/4 after building foundation
- **Rollback capability**: Can revert one phase without losing months of work

### 2. Continuous Value Delivery
During a 6-month rewrite, users get:
- ❌ No new features
- ❌ No bug fixes
- ❌ Anxiety about "big changes coming"

During 6-month evolutive migration, users get:
- ✅ Improved performance (Phase 2 API separation)
- ✅ Better offline UX (Phase 4 RxDB)
- ✅ Continued feature development between phases
- ✅ Seamless upgrades

### 3. Learning Budget
We've never built a local-first app with RxDB before. Key unknowns:
- Conflict resolution strategies for multi-user shopping lists
- Sync performance with 100+ items per list
- Offline storage limits on mobile browsers
- Real-time collaboration patterns

**Evolutive approach allows learning while building:**
- Phase 2: Learn API design for sync endpoints
- Phase 3: Learn React Query patterns (foundation for RxDB queries)
- Phase 4: Apply learnings to RxDB integration

**Rewrite approach forces** all learning upfront with no room for course correction.

### 4. Preserving Options
If during Phase 3 we discover RxDB isn't suitable (e.g., browser compatibility issues), we have:
- ✅ A working API layer (Phase 2)
- ✅ Modern client-side fetching (Phase 3)
- ✅ Option to use alternative (PouchDB, WatermelonDB, custom sync)

With a rewrite, discovering RxDB issues means **starting over**.

---

## Phase Breakdown

### Phase 1: Monorepo Foundation ✅ COMPLETED
**Goal:** Separate frontend and backend codebases

**Deliverables:**
- NPM workspaces with `apps/web` and `apps/server`
- Next.js reverse proxy for API routing
- Shared tooling and configuration

**Value:** Independent deployment of frontend/backend

---

### Phase 2: API Proxy Layer 🔄 IN PROGRESS
**Goal:** Decouple Server Actions from direct database access

**Deliverables:**
- NestJS REST API for all 37 server actions
- Feature flags for gradual migration
- Consolidated database in `apps/server`

**Value:** Clear API boundary, prepared for RxDB sync endpoints

**Why not skip to Phase 4?** Need to understand:
- Optimal API shape for shopping list operations
- Authentication flow across services
- Error handling patterns

---

### Phase 3: Client-Side Fetching 📋 PLANNED
**Goal:** Move data fetching from server to client

**Deliverables:**
- React Query integration
- Client-side API calls replacing Server Actions
- Optimistic updates for better UX

**Value:** Instant UI feedback, foundation for offline mode

**Why necessary?** RxDB queries happen on client. This phase establishes patterns before adding RxDB complexity.

---

### Phase 4: RxDB Integration 🚀 PLANNED
**Goal:** Achieve local-first architecture with offline support

**Deliverables:**
- RxDB schemas mirroring server models
- Bidirectional sync with conflict resolution
- Full offline functionality

**Value:** Core product vision realized

---

## Consequences

### Positive
- ✅ **Reduced risk**: Small, reversible steps
- ✅ **Continuous delivery**: Working app at all times
- ✅ **Learning integration**: Discover and adapt during migration
- ✅ **User experience**: No disruptive cutover
- ✅ **Team morale**: Regular completions vs "months until launch"

### Negative
- ❌ **Temporary code**: Phase 2 APIs will be refactored in Phase 4 for RxDB sync
- ❌ **Coordination overhead**: Must maintain architecture vision across phases
- ❌ **Longer calendar time**: Rewrite might be faster in ideal conditions (but riskier)

### Mitigation Strategies
1. **Document vision**: ADRs and planning docs maintain Phase 4 end goal
2. **Accept temporary scaffolding**: Phase 2 APIs are *intentionally* simple (see ADR 001)
3. **Regular checkpoints**: Review architecture alignment at phase boundaries

---

## Success Metrics

### Overall Success
- [ ] Phase 4 completed with local-first architecture working
- [ ] Zero downtime during entire migration
- [ ] Feature parity with pre-migration app
- [ ] Users unaware of technical changes (seamless UX)

### Per-Phase Success
- **Phase 1**: ✅ Both apps run independently
- **Phase 2**: Prisma calls eliminated from Next.js
- **Phase 3**: Server Actions eliminated
- **Phase 4**: App works offline, syncs when online

---

## References

- [Project Status](../../planning/tickets/PROJECT-STATUS.md) - Phase tracking
- [Phase 2 Migration Plan](../../planning/tickets/phase-2-api-proxy.md)
- [RxDB Documentation](https://rxdb.info/) - Target architecture
- [Incrementalism vs Revolution in Software](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/)

---

**Decision Date:** December 20, 2025  
**Review Date:** After Phase 2 completion (validate before Phase 3)  
**Status:** Active
