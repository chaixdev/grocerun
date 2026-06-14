# Phase 5: Simplification / 3am Hardening

> **Status:** Partially in progress — started prematurely  
> **Branch:** `feature/phase-4-rxdb` (until Phase 4 is merged)  
> **Created:** March 25, 2026

> **Dependency:** Phase 5 was started before Phase 4 was complete. The work done
> (sync service split, client replication simplification, dependency trimming) is valid
> and does not need to be undone. However, Phase 5 proper should not resume until the
> Phase 4 write path (local-first mutations) is complete. See
> [PHASE-4-MIGRATION.md](./PHASE-4-MIGRATION.md) for remaining Phase 4 work.

---

## Goal

Keep the local-first architecture from Phase 4, while reducing cognitive load and
making the system easier to debug under pressure.

Phase 5 is explicitly about removing abstraction and dependency weight that no longer
earns its keep.

---

## Core Rubric (3am Test)

Use this rubric for every simplification decision:

- Does this abstraction remove repeated business logic, or only repeated syntax?
- Does it make failure modes clearer, or hide them?
- Would a new engineer understand it faster than duplicated explicit code?
- If removed, would the code become more honest?
- **3am test:** if someone gets called out of bed for a production issue, can they
  find and fix the bug without reconstructing hidden control flow in their head?

---

## Workstreams

1. **Server sync split**
   - Break `apps/server/src/sync/sync.service.ts` into smaller collection-local modules
   - Keep a thin orchestration entrypoint
   - Prefer locality of behavior over generic sync frameworks

2. **Client replication simplification**
   - Reduce repetitive pull-replication boilerplate in `apps/web/src/core/rxdb/database.ts`
   - Keep explicit collection list, remove low-value repeated glue
   - Do not introduce a sync DSL or config-heavy meta-layer

3. **Membership scope-transition clarity**
   - Consolidate/document household scope expansion and scope revocation behavior
   - Make join/leave/delete reasoning mechanically obvious across server + client

4. **Dependency and code minimization**
   - Continue trimming low-value dependencies where plain code is clearer
   - Prefer tiny local helpers over broad utility dependencies
   - Remove code paths that only exist to support abstractions already retired

5. **Dependency risk and CVE hygiene**
   - Review remaining direct dependencies in each workspace for necessity
   - Run a pragmatic vulnerability sweep (`npm audit`) and classify findings
   - Prioritize low-risk updates first (non-breaking, high/critical CVEs)
   - Document accepted residual risk where upgrades are blocked by architecture/tooling

---

## Guardrails

- Do **not** build a generic sync DSL
- Do **not** optimize for DRY if it makes stack traces or control flow harder to follow
- Do **not** hide ownership boundaries behind config objects unless they improve debugging
- Prefer explicit, local code over reusable but opaque infrastructure
