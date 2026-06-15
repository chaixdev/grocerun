# Architecture

The architecture folder contains Grocerun's large, system-level views: how the
major parts fit together, where important responsibilities live, and which
constraints shape implementation work.

Use this folder for durable architecture orientation. Do not put transient
implementation plans here.

## Views

| View | Purpose |
|---|---|
| [System Overview](./system-overview.md) | Main overview of the SPA, local database, API/server, deployment shape, and core flows. |
| [Domain Model](./domain-model.md) | Core grocery domain entities and relationships. |
| [Data Sync and Concurrency](./data-sync-and-concurrency.md) | Local-first data ownership, RxDB replication, sync, conflicts, shopping locks, and concurrent use. |
| [Security and Auth](./security-and-auth.md) | Google OIDC, bearer tokens, mobile auth restoration fallback, AuthGuard, and accepted security trade-offs. |

## Documentation Routing

| If you are documenting... | Put it in... |
|---|---|
| How the system fits together | `wiki/architecture/` |
| Why a decision was made | `wiki/adr/` |
| A repeatable implementation technique | `wiki/patterns/` |
| A coding convention or hard rule | `wiki/rules/` |
| Domain language/product concepts | `wiki/concepts/` |
| Developer workflow/procedure | `wiki/development/` |
| Work in progress or speculative design | `planning/` |

## Current Architecture in One Paragraph

Grocerun is a Vite React SPA with TanStack Router and RxDB/Dexie local storage,
served in production by a NestJS API process that also exposes REST and sync
endpoints backed by Prisma and SQLite. Google-only authentication is handled by
`oidc-spa`; the browser sends Google ID tokens as Bearer tokens to NestJS, where
`oidc-spa/server` validates them against Google's JWKS. Local-first shopping
state is read from IndexedDB and synchronized to the server through push/pull
replication plus SSE resync notifications.
