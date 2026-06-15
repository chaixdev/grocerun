---
name: repo-dev-commands
description: >
  Development workflow guide for the Grocerun monorepo. Provides the canonical
  commands for running, testing, and inspecting the application.
---

# Grocerun Dev Commands

## Quick Start

```bash
nvm use           # Activate Node 22 (from .nvmrc)
npm install       # Install all workspace dependencies
npm run dev       # Start both apps (Vite :3000, NestJS :3001)
```

The dev command runs both apps in watch mode via the monorepo task runner.
The frontend is a Vite SPA.

## Run the Application

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start both apps (Vite on :3000, NestJS on :3001) |
| `npm run dev --workspace=apps/web` | Start only the frontend |
| `npm run dev --workspace=apps/server` | Start only the backend |

## Run Tests

| Tier | Command | When to run |
|------|---------|------------|
| Unit tests | `npm test` | After every change |
| Unit tests (watch) | `npm test -- --watch` | During development |
| Single file | `npm test -- path/to/test` | Focused iteration |
| E2E tests | `cd apps/e2e && npx playwright test` | Before merging |
| E2E (headed) | `npx playwright test --headed` | Debugging failures |
| Type check | `npm run lint` | After significant changes |

## Database (Prisma)

All Prisma commands run from `apps/server/`:

| Command | What it does |
|---------|-------------|
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma migrate dev` | Apply pending migrations |
| `npx prisma migrate dev --name <name>` | Create a new migration |
| `npx prisma studio` | Open Prisma Studio (database browser on :5555) |
| `npx prisma db push` | Push schema without migrations (dev only) |
| `npx prisma db seed` | Seed the database with test data |

The database file is `apps/server/dev.db` (SQLite).

## Build & Lint

| Command | What it does |
|---------|-------------|
| `npm run build` | Build all workspaces (turborepo) |
| `npm run lint` | Run ESLint across all workspaces |
| `npm run lint --workspace=apps/web` | Lint only the frontend |

## Common Issues

### Port conflicts
```bash
fuser -k 3000/tcp   # Kill process on Vite frontend port
fuser -k 3001/tcp   # Kill process on NestJS port
```

### Prisma client out of sync
```bash
cd apps/server
npx prisma generate
npx prisma migrate dev
```

### Node version mismatch
```bash
nvm use             # Activate version from .nvmrc
npm rebuild         # Rebuild native modules
```

### Google OAuth not working
- Verify frontend OIDC env/config has `VITE_OIDC_CLIENT_ID` and `VITE_OIDC_CLIENT_SECRET`
- Verify server has `OIDC_AUDIENCE` set to the same Google client ID in production
- Check Google Cloud Console redirect URIs include the app root, e.g. `http://localhost:3000/`

## Port Map

| Service | Port |
|---------|------|
| Vite SPA (frontend) | 3000 |
| NestJS (backend) | 3001 |
| Prisma Studio | 5555 |
