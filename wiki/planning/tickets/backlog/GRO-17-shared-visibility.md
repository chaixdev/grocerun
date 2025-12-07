# GRO-17: Shared List Visibility

**User Story**: [US-3: Household Collaboration](../user-stories/US-3-household-collaboration.md)
**Status**: Backlog
**Depends On**: GRO-16

## Context
Once users are in the same household, they should see the same stores and lists.

## Requirements
1. **Store Access**: All household members can view/edit stores
2. **List Access**: All household members can view/edit lists
3. **Authorization**: Update all access checks to include household members

## Acceptance Criteria
- [ ] Member A creates a store → Member B sees it
- [ ] Member A creates a list → Member B sees it
- [ ] Both can add items to the same list

## Technical Notes
- Review `verifyStoreAccess` helper
- May need to update Prisma queries to include household relations
