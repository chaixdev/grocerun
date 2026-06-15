---
name: grocerun-coding-style
description: >
  Lightweight navigation map from concern tracks to specific rule files
  and sections. Load this before any implementation, refactor, or review
  task to ensure adherence to project conventions.
---

# Grocerun Coding Style Navigator

The canonical coding standards live in `wiki/rules/`. This skill provides
a fast cross-reference so agents can locate the relevant rules without
reading every file.

## Concern Track Mapping

When analyzing or implementing code, use this table to find the applicable
standards by concern:

| Track | Applicable Rule Files |
|-------|----------------------|
| **Logic & Correctness** | `wiki/rules/coding-standards.md` — TypeScript Idioms, Error Handling; `wiki/rules/nestjs.md` — Validation |
| **Data & Persistence** | `wiki/rules/prisma.md`; `wiki/rules/rxdb.md` |
| **React & UI** | `wiki/rules/react.md`; `wiki/rules/coding-standards.md` — Error Handling (Client) |
| **API & Auth** | `wiki/rules/nestjs.md`; `wiki/rules/auth.md`; `wiki/rules/coding-standards.md` — Zod validation |
| **Structure & Quality** | `wiki/rules/monorepo-boundaries.md`; `wiki/rules/react.md` — File Organization |
| **Testing** | `wiki/rules/testing-standards.md` |
| **Security & Observability** | `wiki/rules/coding-standards.md` — Logging; `wiki/rules/auth.md`; `wiki/rules/rxdb.md` — Sync state |
| **Git** | `wiki/rules/coding-standards.md` — Git Conventions |

## Mandatory Rules (always applicable)

From `wiki/rules/coding-standards.md`:

1. `strict: true` in every `tsconfig.json` — no implicit nulls
2. Zod schemas at every API boundary — trust nothing from the network
3. Every async component must handle loading, error, and success states
4. Constructor injection only in NestJS — no property injection
5. Never compose user input into database query strings
6. Never log tokens, passwords, or PII
7. No `any` in production code — use `unknown` and narrow
8. Conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
9. Dead code must be deleted — no commented-out blocks "just in case"

## How to Use This Skill

1. Load this skill at the start of any implementation or review task.
2. When you encounter a specific concern (e.g., "I'm writing a Prisma query"),
   cross-reference the track mapping above.
3. Open the corresponding `wiki/rules/` file for detailed guidance.
4. The deep reviewer skill uses this same mapping to assign concern tracks.
