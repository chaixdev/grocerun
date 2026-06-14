# Grocerun Project Documentation

**Root-level documentation** for the overall Grocerun project architecture, decisions, and planning.

---

## Documentation Structure

### `/wiki` (This directory - Current/Active)
Project-wide documentation, architecture decisions, and planning for the monorepo migration and local-first transformation.

**Use this for:**
- Architecture Decision Records (ADRs)
- Cross-cutting concerns (monorepo, deployment, CI/CD)
- Migration planning and progress tracking
- Technical design documents

### `/apps/web/wiki` (Legacy)
Original Next.js app documentation from before monorepo restructuring.

**Status:** Archived for reference, being migrated to root wiki as needed.

---

## Directory Guide

### `/wiki/adr/`
**Architecture Decision Records** - Documenting important technical decisions with context and rationale.

- [001 - Phase 2 API Approach (Simple REST + Zod)](adr/001-phase2-api-approach.md)
- [002 - Evolutive Architecture Migration Strategy](adr/002-evolutive-architecture.md)
- [004 - Inverted Feature Flags for Phase 2](adr/004-inverted-feature-flags.md)

### `/wiki/architecture/`
- [Domain Model](architecture/domain-model.md) - Core entities and relationships

### `/wiki/design/`
Design specifications and system design documents.

- [Household Invitation System](design/household-invitation-system.md) - Token-based invitation design

### `/wiki/planning/`
Migration roadmaps, phase documentation, and project planning.

- [Project Status](planning/PROJECT-STATUS.md) - Current state and progress
- [Phase 2 Migration Checklist](planning/PHASE-2-MIGRATION.md) - Active migration tracker
- [Product Evolution Spec](planning/product-evolution-spec.md) - UX specifications

### `/wiki/development/`
Developer guides, setup instructions, and workflows.

- [Agentic Workflow](development/agentic-workflow.md) - AI-assisted development process
- [DevOps Philosophy](development/devops-philosophy.md) - Deployment and quality practices

### `/wiki/user-guide/`
User-facing documentation and feature guides.

- [Features](user-guide/features.md) - Product capabilities
### `/wiki/development/`
Developer guides, setup instructions, and workflows.

---

## Quick Links

- [Project Status](planning/PROJECT-STATUS.md) - Current state and next steps
- [Phase 2 Migration Checklist](planning/PHASE-2-MIGRATION.md)
- [Product Evolution Spec](planning/product-evolution-spec.md)

---

**Last Updated:** January 9, 2026
