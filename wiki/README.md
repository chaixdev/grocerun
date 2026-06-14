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

- [Domain Model](architecture/domain-model.md) — Core entities and relationships

### `wiki/rules/`
Coding standards, conventions, and contributor guidance.

- [Coding Standards](rules/coding-standards.md) — TypeScript, React, NestJS, Prisma, RxDB, testing

### `wiki/patterns/`
Stable implementation mechanisms that recur across the codebase.

_Extract stable patterns from the codebase as they emerge._

### `wiki/concepts/`
Durable domain abstractions that outlive specific implementations.

_Extract from planning docs as they stabilize._

### `wiki/development/`
Developer guides and workflow documentation.

- [Agentic Workflow](development/agentic-workflow.md) — AI-assisted development process
- [DevOps Philosophy](development/devops-philosophy.md) — Deployment and quality practices
- [E2E Testing Setup](development/e2e-testing-setup.md)
- [E2E Test Organization Guide](development/e2e-test-organization-guide.md)
- [E2E Refactoring Summary](development/e2e-refactoring-summary.md)
- [Fixture Analysis](development/fixture-analysis.md)
- [Regression Test Coverage Analysis](development/regression-test-coverage-analysis.md)
- [Test Code Alignment Analysis](development/test-code-alignment-analysis.md)

### `wiki/user-guide/`
User-facing documentation and feature guides.

- [Features](user-guide/features.md) — Product capabilities

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
planning/brainstorm/  →  planning/tickets/  →  wiki/adr|patterns|concepts|rules/
```

---

**Last Updated:** June 8, 2026
