# GRO-16: Invite User to Household

**User Story**: [US-3: Household Collaboration](../user-stories/US-3-household-collaboration.md)
**Status**: Backlog

## Context
Currently, households are single-user. We need to invite other users.

## Requirements
1. **Invite UI**: Input field for email address
2. **Backend**: 
   - Look up user by email
   - Add user to household
   - Handle "user not found" (invite pending?)
3. **Member List**: Show current household members

## Acceptance Criteria
- [ ] User can invite another user by email
- [ ] Invited user sees the household after login
- [ ] Current members are displayed
- [ ] Owner can remove members

## Technical Notes
- Consider email verification/invitation flow
- For MVP: Just link existing users by email
