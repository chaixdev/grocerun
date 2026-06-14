# Monorepo Architecture

## Overview
Grocerun is structured as a **monorepo** with separate frontend (Next.js) and backend (NestJS) applications. This architecture enables an evolutive approach to migrating from a traditional Next.js app to a Local-First application with offline capabilities.

## Workspace Structure

```
grocerun-local/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── server/       # NestJS backend (port 3001)
├── packages/         # Shared libraries (future)
├── .nvmrc            # Node version (22)
└── package.json      # Root workspace config
```

## Application Stack

### Frontend (apps/web)
- **Framework**: Next.js 16.0.10 (App Router)
- **Port**: 3000
- **Database**: SQLite (`apps/web/dev.db`)
- **ORM**: Prisma 7.2.0
- **Auth**: NextAuth 5.0.0-beta.30
- **UI**: Tailwind CSS 4, Radix UI
- **Key Features**:
  - Server-side rendering (SSR)
  - Server Actions for data mutations
  - Google OAuth integration
  - Reverse proxy to backend API

### Backend (apps/server)
- **Framework**: NestJS 10.0.0
- **Port**: 3001
- **Database**: SQLite (`apps/server/dev.db`)
- **ORM**: Prisma 7.2.0
- **Purpose**: REST API for future Local-First sync

## Development Setup

### Prerequisites
- Node.js 22 (managed via `.nvmrc`)
- npm 10+

### Running Locally
```bash
# Install dependencies
npm install

# Start both apps (concurrently)
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

### Environment Configuration

**apps/web/.env**
```env
DATABASE_URL=file:./dev.db
AUTH_SECRET=<your-secret>
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=<your-google-client-id>
AUTH_GOOGLE_SECRET=<your-google-secret>
```

## API Routing

### Reverse Proxy Configuration
Next.js is configured to proxy API requests to the NestJS backend:

```javascript
// apps/web/next.config.mjs
async rewrites() {
    return [
        {
            source: "/api/v1/:path*",
            destination: "http://localhost:3001/:path*",
        },
    ];
}
```

### Route Mapping
- **Frontend**: `http://localhost:3000`
- **NextAuth**: `http://localhost:3000/api/auth/*` (handled by Next.js)
- **Backend API**: `http://localhost:3000/api/v1/*` (proxied to port 3001)

This setup ensures:
1. Google OAuth redirects work correctly (port 3000)
2. Frontend can access backend API without CORS issues
3. Single entry point for the application

## Migration Strategy

This monorepo supports a phased migration to Local-First architecture:

### Phase 1: Current State (Complete)
- Next.js app with Server Actions
- Direct Prisma database access
- Google OAuth authentication

### Phase 2: API Proxy (In Progress)
- Server Actions call NestJS API instead of direct DB
- Decouples frontend from database schema
- Prepares for client-side data fetching

### Phase 3: Client Fetch
- Replace Server Actions with client-side React Query/SWR
- Direct API calls from browser
- Prepares for RxDB integration

### Phase 4: Local-First
- Inject RxDB for local storage
- Implement sync protocol with NestJS
- Enable offline capabilities

## Deployment

### Single Container Strategy
In production, both apps run in a single container:
- Next.js serves the frontend
- Reverse proxy forwards `/api/v1/*` to NestJS
- Single port (3000) exposed externally

### Docker Configuration
See [DEPLOY.md](../../DEPLOY.md) for production deployment instructions.

## Database Management

### Frontend Database
```bash
cd apps/web
npx prisma migrate dev
npx prisma studio --port 5555
```

### Backend Database
```bash
cd apps/server
npx prisma migrate dev
npx prisma studio --port 5556
```

## Troubleshooting

### Port Conflicts
If port 3000 is in use:
```bash
lsof -i :3000 | grep LISTEN
fuser -k 3000/tcp
```

### Prisma Client Issues
After schema changes, regenerate the client:
```bash
npx prisma generate --schema=apps/web/prisma/schema.prisma
```

### Node Version
Ensure you're using Node 22:
```bash
nvm use
node --version  # Should show v22.x.x
```
