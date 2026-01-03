# GRO-110: User & Household Domain

**User Story**: [US-100: Identity & Access](../user-stories/US-100-identity-access.md)
**Status**: DONE

## Context
We need to define the core entities that represent "Who" is using the app. In our Local-First architecture, this data must be synchronized to the client so the UI knows the current user's context.

## Requirements
1.  **Prisma Schema**:
    -   `User`: id, email, name, householdId (FK).
    -   `Household`: id, name, ownerId.
2.  **RxDB Schema**:
    -   Replicate the Prisma schema for the client.
    -   Ensure `householdId` is available for filtering other collections.
3.  **Sync Rules**:
    -   Users can only sync their *own* User profile.
    -   Users can sync the *Household* they belong to.
4.  **Seed Data**:
    -   Create a default "Demo Household" for development.

## Acceptance Criteria
- [x] `User` and `Household` models defined in `schema.prisma`.
- [x] `User` and `Household` RxDB schemas created in `client/src/db/schema`.
- [x] Sync endpoints enabled for these collections.
- [x] Verified: Creating a user in Prisma appears in RxDB (and vice versa).

## Implementation Notes
- Implemented M:N relationship between User and Household
- Created server endpoints: `/users` and `/households` with pull/push handlers
- RxDB schemas use `householdIds: string[]` denormalization for client-side queries
- Added seed script to populate demo user and household
- Created SyncDebug component for visual verification
