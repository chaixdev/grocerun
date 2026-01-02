# GRO-3: Store Management (CRUD)

**Phase**: 1 - Core Setup
**Status**: Done

## Context
Users shop at specific stores. The application needs to allow users to manage a list of their frequent stores to organize their shopping lists effectively.

## Requirements
- **Household Context**: Users must belong to a Household. Stores are created within a Household.
- Allow users to create, view, update, and delete Stores *for their Household*.
- Ensure stores are shared with all members of the Household.

## Acceptance Criteria
- [ ] **Household**: User is assigned a default Household on signup (or can create one).
- [ ] **Create**: User can add a new store to their Household.
- [ ] **Read**: User can see all stores in their Household.
- [ ] **Update**: User can rename a store.
- [ ] **Delete**: User can remove a store.
- [ ] **Sharing**: User A and User B in the same Household see the same stores.
- [ ] **Validation**: Store name cannot be empty.

## Definition of Done
- **See `planning/DOD.md`**
