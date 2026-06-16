# Rules

Canonical coding standards, conventions, and contributor guidance.

These documents define **how** work is done. They are stable, accepted truth —
not proposals or works-in-progress. Rules apply to both human contributors
and AI agents.

## Structure

- **`coding-standards.md`** — Portable TypeScript/Node/React/NestJS best
  practices. Reusable across projects in the same stack.
- **Topic-level rules** — Project-specific conventions, grouped by domain.
  These enforce consistency and prevent regressions against known patterns.

## For Agents

The `grocerun-coding-style` skill provides a fast navigation map from concern
tracks to specific sections of these rule files. Load it before any
implementation, refactor, or review task.

## Documents

| File | Scope |
|------|-------|
| [`coding-standards.md`](./coding-standards.md) | Portable universal rules — TypeScript, error handling, logging, git |
| [`testing-standards.md`](./testing-standards.md) | Testing pyramid, tooling, integration/component/e2e conventions |
| [`prisma.md`](./prisma.md) | Soft-delete, query patterns, transactions, migrations |
| [`nestjs.md`](./nestjs.md) | Module structure, controller/service patterns, validation |
| [`react.md`](./react.md) | File organization, hooks, component structure, state architecture |
| [`rxdb.md`](./rxdb.md) | Replication, schema, local-first write patterns, offline persistence |
| [`auth.md`](./auth.md) | OIDC, JWT, guard patterns, shopping lock identity |
| [`monorepo-boundaries.md`](./monorepo-boundaries.md) | Import rules, shared code, documentation hierarchy |
| [`production-quality.md`](./production-quality.md) | Performance, observability, reliability — rules that prevent the most expensive bugs |
| [`ci-guardrails.md`](./ci-guardrails.md) | CI pipeline gates, ESLint rules, PR requirements — enforcement mechanisms |
