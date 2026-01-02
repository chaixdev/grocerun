# GRO-132: Household Invitations

**User Story**: [US-100: Identity & Access](../user-stories/US-100-identity-access.md)
**Status**: TODO

## Context
Allow users to add family members to their household.

## Requirements
1.  **Schema**:
    -   `Invitation` model (token, householdId, expiresAt).
2.  **Backend Actions**:
    -   `createInvitation`: Generate token.
    -   `acceptInvitation`: Link user to household.
3.  **UI**:
    -   **Settings Page**: "Invite Member" button -> Shows Link/Token.
    -   **Registration/Login**: "Join Household" input field.

## Acceptance Criteria
- [ ] User can generate an invite link.
- [ ] New user can sign up/login and join the household using the link.
- [ ] Both users see the same data after joining.
