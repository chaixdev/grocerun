# GRO-103: Prisma + SQLite Setup

**Status:** ✅ Done  
**Phase:** 0 - Architecture Foundation  
**User Story:** N/A (Infrastructure)

## Description
Set up Prisma ORM with SQLite adapter for the server application.

## Acceptance Criteria
- [x] Prisma initialized in `apps/server`
- [x] SQLite database configured
- [x] Basic `Item` model for testing sync
- [x] Migration created and applied
- [x] PrismaService injectable in NestJS

## Implementation Notes
- Using Prisma 7.x with `@prisma/adapter-better-sqlite3`
- Database file: `apps/server/dev.db`
- Prisma config in `prisma.config.ts` (Prisma 7 style)

## Schema
```prisma
model Item {
  id        String   @id @default(cuid())
  name      String
  checked   Boolean  @default(false)
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())
}
```
