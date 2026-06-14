---
name: grocerun-coding-style
description: >
  Lightweight navigation map from concern tracks to sections of the canonical
  coding standards document. Load this before any implementation, refactor,
  or review task to ensure adherence to project conventions.
---

# Grocerun Coding Style Navigator

The canonical coding standards live at `wiki/rules/coding-standards.md`.
This skill provides a fast cross-reference so agents can locate the relevant
rules without reading the entire document.

## Concern Track Mapping

When analyzing or implementing code, use this table to find the applicable
standards by concern:

| Track | Relevant Standards Sections |
|-------|---------------------------|
| **Logic & Correctness** | TypeScript Idioms, Error Handling, NestJS → Validation pipes |
| **Data & Persistence** | Prisma & Database, RxDB & Local-First |
| **React & UI** | React & Next.js, React Query conventions, Loading and error states |
| **API & Auth** | NestJS, Auth guards, TypeScript Idioms → Zod |
| **Structure & Quality** | Monorepo Boundaries, React & Next.js → Component structure |
| **Testing** | Testing |
| **Security & Observability** | Logging, NestJS → Error responses, RxDB → Sync state |

## Mandatory Rules (always applicable)

1. `strict: true` in every `tsconfig.json` — no implicit nulls
2. Zod schemas at every API boundary — trust nothing from the network
3. Every async component must handle loading, error, and success states
4. Constructor injection only in NestJS — no property injection
5. Soft-delete for all domain models — Prisma queries must filter `deleted: false`
6. Never compose user input into database query strings
7. Never log tokens, passwords, or PII
8. No `any` in production code — use `unknown` and narrow
9. Conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
10. Dead code must be deleted — no commented-out blocks "just in case"

## How to Use This Skill

1. Load this skill at the start of any implementation or review task.
2. When you encounter a specific concern (e.g., "I'm writing a Prisma query"),
   cross-reference the track mapping above.
3. Open `wiki/rules/coding-standards.md` to the relevant section for detailed guidance.
4. The deep reviewer skill uses this same mapping to assign concern tracks.
