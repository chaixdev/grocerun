# Grocerun v2 Roadmap

> [!NOTE]
> This document tracks the **Local-First Architecture** reimplementation.
> For the original product vision, see [initial-pitch.md](./initial-pitch.md) and [product-evolution-spec.md](./product-evolution-spec.md).

## 🎯 Current Focus: Foundation

Building the core infrastructure before porting features.

---

## 🟢 Phase 0: Architecture Foundation
*Goal: Establish the monorepo, local-first data layer, and sync protocol.*

- [x] [GRO-100: Monorepo Setup](./tickets/GRO-100-monorepo-setup.md)
- [x] [GRO-101: Vite + React Client Scaffold](./tickets/GRO-101-client-scaffold.md)
- [x] [GRO-102: NestJS Server Scaffold](./tickets/GRO-102-server-scaffold.md)
- [x] [GRO-103: Prisma + SQLite Setup](./tickets/GRO-103-prisma-setup.md)
- [ ] [GRO-104: RxDB Integration](./tickets/GRO-104-rxdb-integration.md)
- [ ] [GRO-105: Sync Protocol Implementation](./tickets/GRO-105-sync-protocol.md)
- [ ] [GRO-106: Tailwind + Shadcn UI Setup](./tickets/GRO-106-styling-setup.md)

## 🟡 Phase 1: Core Data Model
*Goal: Implement the domain model with local-first sync.*

- [ ] [GRO-110: User & Household Models](./tickets/GRO-110-user-household.md)
- [ ] [GRO-111: Store & Section Models](./tickets/GRO-111-store-section.md)
- [ ] [GRO-112: CatalogItem Model](./tickets/GRO-112-catalog-item.md)
- [ ] [GRO-113: ShoppingList & ListItem Models](./tickets/GRO-113-list-models.md)
- [ ] [GRO-114: Full Sync for All Entities](./tickets/GRO-114-full-sync.md)

## 🟠 Phase 2: Authentication
*Goal: Secure the app with modern auth.*

- [ ] [GRO-120: Auth Strategy Selection](./tickets/GRO-120-auth-strategy.md)
- [ ] [GRO-121: Server-Side Auth (NestJS Guards)](./tickets/GRO-121-server-auth.md)
- [ ] [GRO-122: Client-Side Auth Flow](./tickets/GRO-122-client-auth.md)
- [ ] [GRO-123: Protected Sync Endpoints](./tickets/GRO-123-protected-sync.md)

## 🔴 Phase 3: UI Shell & Navigation
*Goal: Port the responsive shell from legacy.*

- [ ] [GRO-130: Responsive Layout (Mobile/Desktop)](./tickets/GRO-130-responsive-layout.md)
- [ ] [GRO-131: Bottom Nav (Mobile)](./tickets/GRO-131-bottom-nav.md)
- [ ] [GRO-132: Sidebar (Desktop)](./tickets/GRO-132-sidebar.md)
- [ ] [GRO-133: Theme Toggle (Dark/Light)](./tickets/GRO-133-theme-toggle.md)
- [ ] [GRO-134: React Router Setup](./tickets/GRO-134-routing.md)

## 🟣 Phase 4: Feature Parity (Planning Mode)
*Goal: Rebuild the planning experience.*

- [ ] [GRO-140: Dashboard / Active Lists](./tickets/GRO-140-dashboard.md)
- [ ] [GRO-141: Store Directory](./tickets/GRO-141-store-directory.md)
- [ ] [GRO-142: Store Configuration (Sections)](./tickets/GRO-142-store-config.md)
- [ ] [GRO-143: List Creation Flow](./tickets/GRO-143-list-creation.md)
- [ ] [GRO-144: Item Autocomplete](./tickets/GRO-144-autocomplete.md)
- [ ] [GRO-145: Planning Mode UI](./tickets/GRO-145-planning-mode.md)

## ⚫ Phase 5: Feature Parity (Shopping Mode)
*Goal: Rebuild the in-store experience.*

- [ ] [GRO-150: Shopping Mode UI](./tickets/GRO-150-shopping-mode.md)
- [ ] [GRO-151: Wake Lock](./tickets/GRO-151-wake-lock.md)
- [ ] [GRO-152: Check-off with Optimistic UI](./tickets/GRO-152-check-off.md)
- [ ] [GRO-153: Trip Completion Flow](./tickets/GRO-153-trip-completion.md)
- [ ] [GRO-154: Archived Lists](./tickets/GRO-154-archived-lists.md)

## 🔵 Phase 6: Production Readiness
*Goal: Prepare for release.*

- [ ] [GRO-160: Dockerfile (Multi-stage)](./tickets/GRO-160-dockerfile.md)
- [ ] [GRO-161: CI/CD Pipeline](./tickets/GRO-161-ci-cd.md)
- [ ] [GRO-162: E2E Tests](./tickets/GRO-162-e2e-tests.md)
- [ ] [GRO-163: Documentation Finalization](./tickets/GRO-163-docs.md)
- [ ] [GRO-164: v2.0.0 Release](./tickets/GRO-164-release.md)

---

## ✅ Completed (Legacy v1)
The following features were implemented in v1 and will be ported:
- Responsive Navigation Shell
- Store CRUD & Section Management
- List Creation & Item Management
- Planning Mode UI
- Invitation System
- Settings Page

See [legacy/wiki/planning/roadmap.md](../../legacy/wiki/planning/roadmap.md) for v1 history.
