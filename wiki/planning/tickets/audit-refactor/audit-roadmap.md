# Audit Remediation & Refactor Roadmap

**Created:** December 9, 2025  
**Related:** [Architecture Audit](../../../audit.md) | [GRO-53 Refactor](../backlog/GRO-53-refactor-folder-structure.md)

---

## Overview

This roadmap sequences the audit remediation items with the planned folder structure refactor (GRO-53) to minimize rework and maximize efficiency.

---

## Phase 1: Foundation (Pre-Refactor)

**Goal:** Establish safety nets and complete schema changes before moving files.

| Order | Ticket | Audit Item | Rationale |
|-------|--------|------------|-----------|
| 1.1 | GRO-54 | #29 | Testing infrastructure must come first — validates refactor doesn't break anything |
| 1.2 | GRO-55 | #7 | Pin NextAuth version — 30-second fix, prevents surprises |
| 1.3 | GRO-56 | #15 | Add `onDelete: SetNull` — schema migration easier before file moves |
| 1.4 | GRO-57 | #16 | Add database indexes — complete schema work while structure is stable |
| 1.5 | GRO-58 | #18 | Environment variable validation — foundational safety |

**Exit Criteria:** 
- Vitest configured with at least smoke tests for server actions
- Prisma schema updated with proper cascade rules and indexes
- `next-auth` pinned to exact version
- Env validation fails fast on missing variables

---

## Phase 2: Refactor (GRO-53 + Absorbed Items)

**Goal:** Execute folder restructure while fixing co-located issues.

| Order | Ticket | Scope | Absorbed Items |
|-------|--------|-------|----------------|
| 2.1 | GRO-59 | Core infrastructure (`src/core/`) | #33 (schema centralization) |
| 2.2 | GRO-60 | Feature: Lists | #11 (split ListEditor) |
| 2.3 | GRO-61 | Feature: Stores | — |
| 2.4 | GRO-62 | Feature: Households | — |
| 2.5 | GRO-63 | Shared components cleanup | #12 (nav config extraction), #26 (date standardization) |
| 2.6 | GRO-64 | Nitpick sweep | #1, #10, #13, #19, #20, #22, #27, #30, #32 |

**Exit Criteria:**
- Feature-based folder structure in place
- `npm run build` passes
- ListEditor split into manageable components
- Navigation config centralized
- Date handling standardized with `date-fns`

---

## Phase 3: Standardization (Post-Refactor)

**Goal:** Apply consistent patterns across the now-organized codebase.

| Order | Ticket | Audit Items | Rationale |
|-------|--------|-------------|-----------|
| 3.1 | GRO-65 | #2, #3 | Error handling standardization — easier with grouped actions |
| 3.2 | GRO-66 | #8 | Input validation — batch apply Zod to all actions |
| 3.3 | GRO-67 | #25 | Error boundaries — add to feature structure |
| 3.4 | GRO-68 | #5 | Rate limiting — security hardening |

**Exit Criteria:**
- All server actions return consistent `{ success, data?, error? }` shape
- All action inputs validated with Zod
- Error boundaries at route and feature levels
- Rate limiting on sensitive operations

---

## Phase 4: Scale & Polish (Ongoing)

**Goal:** Performance and UX improvements as needed.

| Order | Ticket | Audit Items | Priority |
|-------|--------|-------------|----------|
| 4.1 | GRO-69 | #23 | Pagination — when data volume requires it |
| 4.2 | GRO-70 | #21, #28 | Accessibility & loading states |
| 4.3 | GRO-71 | #4, #6, #9, #14, #17, #24, #31, #34, #35 | Remaining low-priority items |

**Exit Criteria:**
- List queries paginated
- ARIA labels on all interactive elements
- Loading states for page transitions

---

## Dependency Graph

```
Phase 1 (Sequential)
    │
    ├── GRO-54 (Tests) ─────────────────────────────┐
    │                                               │
    ├── GRO-55 (Pin NextAuth) [independent]         │
    │                                               │
    ├── GRO-56 (Cascade Delete) ──┐                 │
    │                             ├── Schema work   │
    ├── GRO-57 (Indexes) ─────────┘                 │
    │                                               │
    └── GRO-58 (Env Validation) [independent]       │
                                                    │
Phase 2 (Sequential, depends on Phase 1) ◄──────────┘
    │
    ├── GRO-59 (Core) ──► GRO-60 (Lists) ──► GRO-61 (Stores)
    │                                              │
    │                     GRO-62 (Households) ◄────┘
    │                              │
    │                     GRO-63 (Shared) ◄────────┘
    │                              │
    └── GRO-64 (Nitpicks) ◄────────┘
                    │
Phase 3 (Can parallelize after Phase 2)
    │
    ├── GRO-65 (Error Handling) ─┬─► GRO-66 (Validation)
    │                            │
    ├── GRO-67 (Error Boundaries)│
    │                            │
    └── GRO-68 (Rate Limiting) ──┘
                    │
Phase 4 (Ongoing, as needed)
    │
    └── GRO-69, GRO-70, GRO-71
```

---

## Estimated Effort

| Phase | Tickets | Estimated Time |
|-------|---------|----------------|
| Phase 1 | 5 | 1-2 days |
| Phase 2 | 6 | 3-4 days |
| Phase 3 | 4 | 2-3 days |
| Phase 4 | 3 | Ongoing |

**Total:** ~1.5-2 weeks focused work

---

## Success Metrics

- [ ] All 35 audit items addressed or explicitly deferred
- [ ] Build passes with no TypeScript errors
- [ ] Test coverage > 0% (baseline established)
- [ ] Feature code co-located in `src/features/`
- [ ] No duplicate configuration across components
