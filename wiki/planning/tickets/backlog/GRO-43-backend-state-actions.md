# GRO-43: Backend - State Transition Actions

**Story**: "US-9: The Shopping Lifecycle"
**Status**: Todo

## Context
Server-side logic to handle state transitions safely.

## Requirements
1.  **Actions**:
    -   `startShopping(listId)`: Sets status to `SHOPPING`.
    -   `finishShopping(listId)`: Sets status to `COMPLETED`.
    -   `cancelShopping(listId)`: Reverts to `PLANNING`.
2.  **Validation**: Ensure user has access to the list.

## Acceptance Criteria
- [ ] `startShopping` updates status
- [ ] `finishShopping` updates status
- [ ] `cancelShopping` updates status
- [ ] Actions are protected by auth/permissions
