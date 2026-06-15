---
name: grocerun-knowledge-sources
description: >
  Pointers to authoritative documentation and knowledge sources for
  the Grocerun project. Load this when the agent needs project context
  beyond the source code.
---

# Grocerun Knowledge Sources

## Primary Sources

### Canonical Documentation (`wiki/`)
Stable, accepted truth about the project:

- **ADR** (`wiki/adr/`) — Architecture Decision Records, including superseded NextAuth-era auth decisions and current local-first/auth restoration decisions
- **Architecture** (`wiki/architecture/`) — Domain model, system viewpoints
- **Rules** (`wiki/rules/`) — Coding standards, testing conventions, API design guidelines
- **Patterns** (`wiki/patterns/`) — Stable implementation mechanisms (sync, auth, feature flags)
- **Concepts** (`wiki/concepts/`) — Durable domain abstractions (shopping state machine, household model)
- **Development** (`wiki/development/`) — Agentic workflow, devops philosophy, e2e guides

### Planning & Work-in-Progress (`planning/`)
Current and future work — not yet canonical:

- **Tickets** (`planning/tickets/`) — Phase migration docs, user stories (10 stories, tracked with status), product evolution spec
- **Brainstorm** (`planning/brainstorm/`) — Speculative solution exploration
- **Reviews** (`planning/reviews/`) — Code review output

### Project Status
`planning/tickets/PROJECT-STATUS.md` — Always read this first when resuming work.
It contains the current phase, completed work, open questions, and next steps.

### External Documentation
- **Vite**: Latest docs at https://vite.dev/guide/
- **TanStack Router**: Latest docs at https://tanstack.com/router/latest
- **NestJS**: Latest docs at https://docs.nestjs.com
- **Prisma**: Latest docs at https://www.prisma.io/docs
- **TanStack Query**: Latest docs at https://tanstack.com/query/latest
- **RxDB**: Latest docs at https://rxdb.info
- **Zod**: Latest docs at https://zod.dev

## Tech Stack Quick Reference

| Layer | Technology | Location |
|-------|-----------|----------|
| Frontend | Vite 6 + React 19 + TanStack Router | `apps/web/` |
| Backend | NestJS 11 | `apps/server/` |
| ORM | Prisma 7 | `apps/server/prisma/` |
| Database | SQLite | `apps/server/dev.db` |
| Auth | oidc-spa (Google-only OIDC) | `apps/web/src/core/auth/` |
| Data Fetching | React Query 5 | `apps/web/src/features/*/hooks/` |
| Local DB | RxDB + Dexie.js | `apps/web/src/core/rxdb/` |
| Validation | Zod | Shared in `packages/dto/` |
| E2E | Playwright | `apps/e2e/` |
| Monorepo | Turborepo + npm workspaces | Root `package.json`, `turbo.json` |

## Common Commands

```bash
npm run dev          # Start both apps (Vite :3000, NestJS :3001)
npm test             # Run unit tests
npm run lint         # Run linting
npm run build        # Build all packages
```

NestJS-specific:
```bash
cd apps/server
npx prisma generate       # Regenerate Prisma client
npx prisma migrate dev    # Apply migrations
npx prisma studio         # Open database browser
```

## Key Files

- Root config: `package.json`, `turbo.json`, `.nvmrc`
- Frontend config: `apps/web/vite.config.ts`
- Frontend root route/auth bootstrap: `apps/web/src/routes/__root.tsx`
- API client: `apps/web/src/core/lib/api.ts`
- App auth facade: `apps/web/src/core/auth/session.ts`
- OIDC singleton: `apps/web/src/core/auth/oidc.ts`
- DB schema: `apps/server/prisma/schema.prisma`
- Auth guard: `apps/server/src/auth/auth.guard.ts`
