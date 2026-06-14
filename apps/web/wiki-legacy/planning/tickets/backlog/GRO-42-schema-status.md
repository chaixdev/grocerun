# GRO-42: Schema Migration - List Status Enum

**Story**: "US-9: The Shopping Lifecycle"
**Status**: Todo

## Context
"I need to enforce these states so that the frontend can react accordingly."

## Requirements
1.  **Schema Change**: Add `status` enum to `List` model.
    -   Values: `PLANNING`, `SHOPPING`, `COMPLETED`.
2.  **Migration**: Create and run migration.
3.  **Defaults**: New lists default to `PLANNING`.

## Acceptance Criteria
- [ ] `status` column exists on `List` table
- [ ] Enum values are enforced
- [ ] Existing data is backfilled (if any)
