# GRO-110: User & Household Domain

**User Story**: [US-100: Identity & Access](../user-stories/US-100-identity-access.md)
**Status**: TODO

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
- [ ] `User` and `Household` models defined in `schema.prisma`.
- [ ] `User` and `Household` RxDB schemas created in `client/src/db/schema`.
- [ ] Sync endpoints enabled for these collections.
- [ ] Verified: Creating a user in Prisma appears in RxDB (and vice versa).
