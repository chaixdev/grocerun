# Grocerun Architecture

## Overview

Grocerun v2 is built on a **Local-First Architecture** that prioritizes offline capability and instant responsiveness.

## Core Principles

### 1. Local-First (Offline-First)
- All user interactions write to a **local database** (IndexedDB via RxDB)
- UI responds instantly without waiting for network
- Sync happens in the background when connected
- Works fully offline; syncs when back online

### 2. Single Container Deployment
- Simple self-hosting via Docker
- NestJS serves both API and static frontend
- SQLite for server-side persistence

### 3. Type Safety End-to-End
- Shared types between client and server
- Prisma generates types from schema
- RxDB schemas mirror Prisma models

## Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Client UI** | React 18 + Vite | Component rendering |
| **Client State** | RxDB + IndexedDB | Local persistence & reactivity |
| **Client Styling** | Tailwind CSS + Shadcn UI | Design system |
| **Server API** | NestJS | REST endpoints for sync |
| **Server ORM** | Prisma | Database access |
| **Server DB** | SQLite | Persistent storage |
| **Auth** | TBD (Google OAuth / Passkeys) | User authentication |

## Project Structure

```
grocerun/
├── apps/
│   ├── client/          # Vite + React + RxDB
│   │   ├── src/
│   │   │   ├── components/   # UI components
│   │   │   ├── features/     # Feature modules
│   │   │   ├── db/           # RxDB setup & schemas
│   │   │   └── hooks/        # React hooks
│   │   └── package.json
│   │
│   └── server/          # NestJS + Prisma
│       ├── src/
│       │   ├── modules/      # Feature modules
│       │   └── prisma/       # Prisma service
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── packages/
│   └── shared/          # Shared types & utilities
│
└── wiki/                # Documentation
```

## Data Flow

### Write Path (Local-First)
```
User Action → RxDB (Local) → UI Updates Instantly
                   ↓
              Background Sync → NestJS API → Prisma → SQLite
```

### Read Path
```
App Start → Load from RxDB (Local) → Display UI
                    ↓
              Background Pull → Merge Server Changes → Update UI
```

## Sync Protocol

RxDB handles bidirectional sync via pull/push handlers:

### Pull (Server → Client)
1. Client sends `minUpdatedAt` checkpoint
2. Server returns documents modified since checkpoint
3. RxDB merges into local database

### Push (Client → Server)
1. RxDB collects locally modified documents
2. Sends batch to server
3. Server upserts and returns conflicts (if any)

### Multi-Household Sync
- Server scopes all sync queries to user's households
- User syncs ALL data for ALL households they're a member of
- Client filters by active household at the UI layer
- See [Multi-Household Sync](../design/multi-household-sync.md) for details

## Key Design Decisions

### Why RxDB over ElectricSQL?
- **Single Container**: ElectricSQL requires a separate sync service + Postgres
- **Flexibility**: RxDB syncs to any backend (REST, GraphQL, WebSocket)
- **Maturity**: RxDB has been battle-tested for offline-first apps

### Why SQLite?
- **Simplicity**: No separate database server to manage
- **Self-Hosting**: Users can backup by copying a single file
- **Performance**: More than sufficient for household-scale data

### Why NestJS?
- **Structure**: Enforces modular architecture
- **Enterprise Patterns**: Dependency injection, decorators, guards
- **TypeScript**: First-class TS support with strict typing
