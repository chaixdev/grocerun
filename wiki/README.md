# Grocerun Wiki

Welcome to the Grocerun documentation.

## 📚 Guides

- **[User Guide](./user-guide/features.md)**: Learn about Grocerun features and how to use them.
- **[Self-Hosting](./user-guide/self-hosting.md)**: Instructions for deploying Grocerun on your own server.
- **[Developer Guide](./developer-guide/architecture.md)**: Architecture, philosophy, and contribution guidelines.
- **[Agentic Workflow](./developer-guide/agentic-workflow.md)**: Standard operating procedure for development tasks.

## 🛠️ Planning

- **[Roadmap](./planning/roadmap.md)**: Current progress and feature tracking.
- **[Tickets](./planning/tickets/)**: Active and backlog tasks.
- **[User Stories](./planning/user-stories/)**: Feature requirements from user perspective.

## 🏗️ Architecture

Grocerun v2 uses a **Local-First Architecture**:
- **Frontend**: React + Vite + RxDB (IndexedDB)
- **Backend**: NestJS + Prisma + SQLite
- **Sync**: Background replication between local and server databases
