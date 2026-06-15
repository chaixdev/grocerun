# Grocerun Project Documentation

**Canonical documentation** — stable, accepted truth about the project's architecture, decisions, standards, and patterns.

For work-in-progress (phase plans, user stories, brainstorm, reviews), see `planning/`.

---

## Directory Guide

### `wiki/adr/`
**Architecture Decision Records** — Important technical decisions with context and rationale.

- [001 - Phase 2 API Approach (Simple REST + Zod)](adr/001-phase2-api-approach.md)
- [002 - Evolutive Architecture Migration Strategy](adr/002-evolutive-architecture.md)
- [003 - JWT Authentication](adr/003-jwt-authentication.md)
- [004 - Inverted Feature Flags for Phase 2](adr/004-inverted-feature-flags.md)
- [005 - E2E Testing](adr/005-e2e-testing.md)
- [005 - Testing Tool Evaluation](adr/005-testing-tool-evaluation.md)
- [006 - Phase 3 Auth Strategy](adr/006-phase3-auth-strategy.md)
- [007 - Phase 4 Local-First Strategy](adr/007-phase4-local-first-strategy.md)

### `wiki/architecture/`
Multi-viewpoint architecture documentation.

- [Architecture Index](architecture/README.md) — View guide and documentation routing
- [System Overview](architecture/system-overview.md) — SPA, API/server, local DB, deployment, and core flows
- [Domain Model](architecture/domain-model.md) — Core entities and relationships
- [Data Sync and Concurrency](architecture/data-sync-and-concurrency.md) — RxDB replication, conflicts, locks, and sync boundaries
- [Security and Auth](architecture/security-and-auth.md) — Google OIDC, Bearer tokens, guards, and mobile auth restoration

### `wiki/rules/`
Coding standards, conventions, and contributor guidance.

- [Coding Standards](rules/coding-standards.md) — TypeScript, React, NestJS, Prisma, RxDB, testing

### `wiki/technical-design/`
Feature-level technical design notes for noteworthy accepted implementation
mechanics: state machines, call sequences, layer boundaries, OOP models, and
design patterns.

- [Technical Design Index](technical-design/README.md)

### `wiki/development/`
Developer guides and workflow documentation.

- [Agentic Workflow](development/agentic-workflow.md) — AI-assisted development process
- [DevOps Philosophy](development/devops-philosophy.md) — Deployment and quality practices
- [Development Index](development/README.md) — Scope rules for this folder

Historical E2E planning and analysis artifacts live under
`planning/archive/e2e-testing-2026-01/`. The active E2E harness guide is
[`apps/e2e/README.md`](../apps/e2e/README.md).

### `wiki/user-guide/`
User-facing documentation for app users and self-hosters.

- [User Guide Index](user-guide/README.md)
- [App Feature Tour](user-guide/app-features.md) — How to use Grocerun
- [Self-Hosting Guide](user-guide/self-hosting.md) — Deploy on your own server

---

## Related

- `planning/tickets/PROJECT-STATUS.md` — Current phase, progress, next steps
- `planning/tickets/user-stories/` — User stories with implementation status
- `AGENTS.md` — Agent guide (build, test, doc routing, mandatory skills)
- `.opencode/` — Agent skills, commands, and configuration

---

## Documentation Philosophy

- **`wiki/`** is canonical truth — stable, accepted, implemented
- **`planning/`** is work-in-progress — speculative, in-flight, transient

Nothing in-progress or speculative touches `wiki/`. Promotion path:
```
planning/brainstorm/  →  planning/tickets/  →  wiki/adr|technical-design|rules/
```

---

**Last Updated:** June 15, 2026
