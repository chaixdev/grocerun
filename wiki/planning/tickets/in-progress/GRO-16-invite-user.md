# GRO-16: Invite User to Household

**User Story**: [US-3: Household Collaboration](../user-stories/US-3-household-collaboration.md)
**Status**: Backlog

## Context
We are implementing a token-based invitation system (KISS/YAGNI). This ticket covers the backend foundation.

## Requirements
1.  **Schema**: Create `Invitation` model.
    -   `token` (unique, indexed)
    -   `status` (ACTIVE, COMPLETED, EXPIRED, REVOKED)
    -   `expiresAt`
2.  **Server Actions**:
    -   `createInvitation(householdId)`: Generate unique token, set expiry (24h).
    -   `joinHousehold(token)`: Validate token, add user to household, mark token COMPLETED.
    -   `revokeInvitation(invitationId)`: Mark token REVOKED.
3.  **Validation**:
    -   Ensure token is single-use.
    -   Ensure token is not expired.

## Acceptance Criteria
- [ ] `Invitation` model created in Prisma schema
- [ ] `createInvitation` action returns a valid token
- [ ] `joinHousehold` successfully adds user and invalidates token
- [ ] `joinHousehold` fails for expired/used tokens

