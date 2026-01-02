# Grocerun v2 Roadmap

> [!NOTE]
> This document tracks the **Local-First Architecture** reimplementation.
> It follows a **Vertical Slice** strategy (Data + Auth + UI per feature) rather than a layered approach.

## 🎯 Current Focus: Identity & Shell

Building the container and the "Who am I?" context.

---

## 🟢 Phase 0: Architecture Foundation
*Goal: Establish the monorepo, local-first data layer, and sync protocol.*

- [x] [GRO-100: Monorepo Setup](./tickets/GRO-100-monorepo-setup.md)
- [x] [GRO-101: Vite + React Client Scaffold](./tickets/GRO-101-client-scaffold.md)
- [x] [GRO-102: NestJS Server Scaffold](./tickets/GRO-102-server-scaffold.md)
- [x] [GRO-103: Prisma + SQLite Setup](./tickets/GRO-103-prisma-setup.md)
- [x] [GRO-104: RxDB Integration](./tickets/GRO-104-rxdb-integration.md)
- [x] [GRO-105: Sync Protocol Implementation](./tickets/GRO-105-sync-protocol.md)
- [x] [GRO-106: Tailwind + Shadcn UI Setup](./tickets/GRO-106-styling-setup.md)

## 🟡 Phase 1: Identity & Shell (The Container)
*Goal: A working app where users can log in, identify their household, and navigate the empty shell.*

- [ ] [GRO-110: User & Household Domain](./tickets/GRO-110-user-household.md) (Schema + Sync)
- [ ] [GRO-120: Authentication System](./tickets/GRO-120-auth-system.md) (JWT + Guards + Login UI)
- [ ] [GRO-130: App Shell & Navigation](./tickets/GRO-130-app-shell.md) (Sidebar, BottomNav, Layout)
- [ ] [GRO-131: Settings & Profile](./tickets/GRO-131-settings.md) (Theme Toggle, User Info)

## 🟠 Phase 2: Store Management (The Context)
*Goal: Users can manage the "places" where shopping happens.*

- [ ] [GRO-200: Store & Section Domain](./tickets/GRO-200-store-domain.md) (Schema + Sync)
- [ ] [GRO-210: Store Directory UI](./tickets/GRO-210-store-directory.md) (List Stores, Add Store)
- [ ] [GRO-220: Store Configuration UI](./tickets/GRO-220-store-config.md) (Manage Sections, Reorder)

## 🔴 Phase 3: Planning Mode (The Core)
*Goal: The core value proposition - creating lists and adding items.*

- [ ] [GRO-300: Catalog & List Domain](./tickets/GRO-300-list-domain.md) (Schema + Sync)
- [ ] [GRO-310: Dashboard & Active Lists](./tickets/GRO-310-dashboard.md) (Home Screen)
- [ ] [GRO-320: List Creation Flow](./tickets/GRO-320-list-creation.md) (New List Dialog)
- [ ] [GRO-330: Planning Mode UI](./tickets/GRO-330-planning-mode.md) (Autocomplete, Add Items, Quantity)

## 🟣 Phase 4: Shopping Mode (The Execution)
*Goal: The in-store experience.*

- [ ] [GRO-400: Shopping Mode UI](./tickets/GRO-400-shopping-mode.md) (Large Checkboxes, Wake Lock)
- [ ] [GRO-410: Trip Completion](./tickets/GRO-410-trip-completion.md) (Checkout, History Update)
- [ ] [GRO-420: Archived Lists](./tickets/GRO-420-archived-lists.md) (History View)

## 🔵 Phase 5: Production Readiness
*Goal: Prepare for release.*

- [ ] [GRO-500: Dockerfile (Multi-stage)](./tickets/GRO-500-dockerfile.md)
- [ ] [GRO-510: CI/CD Pipeline](./tickets/GRO-510-ci-cd.md)
- [ ] [GRO-520: E2E Tests](./tickets/GRO-520-e2e-tests.md)
- [ ] [GRO-530: v2.0.0 Release](./tickets/GRO-530-release.md)

---

## 📚 Reference
See [legacy/wiki/planning/roadmap.md](../../legacy/wiki/planning/roadmap.md) for v1 history.
