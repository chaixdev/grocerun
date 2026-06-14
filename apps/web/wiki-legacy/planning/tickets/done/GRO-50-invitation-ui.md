# GRO-50: Invitation UI (Sender & Receiver)

**Story**: [US-3: Household Collaboration](../user-stories/US-3-household-collaboration.md)
**Status**: Done

## Context
Users need an interface to generate invitation tokens and enter them to join households.

## Requirements
1.  **Sender UI (Settings > Households)**:
    -   "Invite Member" button.
    -   Display generated token.
    -   "Copy to Clipboard" button.
    -   List active invitations (optional for MVP, but good for revocation).
2.  **Receiver UI (Settings > Households)**:
    -   "Join Household" button/input.
    -   Input field for token.
    -   Confirmation/Success message.

## Acceptance Criteria
- [ ] User can generate and copy an invite token
- [ ] User can input a token to join a household
- [ ] Success message displays joined household name
- [ ] Error message displays for invalid/expired tokens
