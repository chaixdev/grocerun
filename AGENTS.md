# Grocerun Agent Guide

## Sources of Truth

Always read these first when resuming work:

- `planning/tickets/PROJECT-STATUS.md` — Current phase, completed work, open questions, next steps
- `planning/tickets/user-stories/README.md` — User story index with implementation status
- `wiki/rules/coding-standards.md` — Canonical coding standards (read before any implementation)

## Build, Test, Run

```bash
# Quick start
nvm use                          # Node 22 (from .nvmrc)
npm install                      # Install dependencies
npm run dev                      # Start both apps (Next.js :3000, NestJS :3001)
npm test                         # Run all tests (server 89 + web 23 + dto 51)
npm run lint                     # Run linting
npm run e2e:run -w e2e           # Run Playwright journeys (requires `npm run dev` first)
```

See `.opencode/skills/repo-dev-commands/SKILL.md` for full command reference.

## Documentation Routing

| If you are writing... | Put it in... | Naming convention |
|----------------------|-------------|-------------------|
| An architectural decision | `wiki/adr/` | `NNN-short-title.md` (numbered) |
| A coding rule or convention | `wiki/rules/` | `topic-slug.md` |
| A feature-level technical design | `wiki/technical-design/` | `topic-slug.md` |
| A developer guide | `wiki/development/` | `topic-slug.md` |
| A work ticket/plan | `planning/tickets/` | Descriptive slug or phase name |
| Speculative solution exploration | `planning/brainstorm/` | `YYYY-MM-DDTHHMM_topic-slug.md` |
| A code review | `planning/reviews/` | `YYYY-MM-DD_review_branch-name.md` |

**Promotion path:** `planning/brainstorm/` → `planning/tickets/` → `wiki/adr|technical-design|rules/`

Only canonical, accepted truth lives in `wiki/`. Everything in-progress or speculative
lives in `planning/`.

## Mandatory Skills

When delegating implementation or review tasks, always load:

- `grocerun-coding-style` — Concern track → coding standards section mapping
- `grocerun-knowledge-sources` — Project documentation pointers

The deep reviewer automatically loads both.

## Agent Architecture

### Skills (`.opencode/skills/`)
- `grocerun-coding-style` — Navigator from concern tracks to coding standards sections
- `grocerun-knowledge-sources` — Project docs, tech stack, key files
- `grocerun-doc-writer` — Produces wiki docs following folder README templates; Mermaid-only diagrams
- `repo-dev-commands` — Development commands reference
- `grocerun-deep-reviewer` — 4-phase parallel code review methodology

### Commands (`.opencode/commands/`)
- `/grocerun-review` — Deep review of current branch against main

## Project Architecture

```
grocerun/
├── apps/
│   ├── web/          # Vite SPA frontend (port 3000)
│   ├── server/       # NestJS 11 backend (port 3001)
│   ├── e2e/          # Playwright end-to-end tests
│   └── _shared/
│       └── dtos/     # Shared DTOs (Zod schemas)
├── wiki/             # Canonical documentation (truth)
├── planning/         # Work-in-progress and speculative
├── .opencode/        # Agent configurations
└── AGENTS.md         # This file
```

## Key Constraints

- Monorepo: runnable apps must not import from each other (use `apps/_shared/dtos/`)
- All API boundaries must have Zod validation
- Soft-delete for all domain models — Prisma queries must filter `deleted: false`
- Auth: JWT via `/api/token`, stored in memory, Bearer in API client
- Phase 4 active: RxDB for local-first shopping, React Query still serving config/admin data
- `strict: true` in all `tsconfig.json` — no implicit nulls
