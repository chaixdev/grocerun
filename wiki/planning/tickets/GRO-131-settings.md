# GRO-131: Settings & Profile

**User Story**: [US-101: Responsive Shell](../user-stories/US-101-responsive-shell.md)
**Status**: TODO

## Context
A place for users to manage their preferences and session.

## Requirements
1.  **Settings Page**:
    -   Route: `/settings`.
2.  **Theme Toggle**:
    -   Switch between Light/Dark/System.
    -   Persist preference in `localStorage`.
3.  **Profile Section**:
    -   Display current User Name & Email.
    -   Display current Household Name.
4.  **Logout Action**:
    -   Clear JWT.
    -   Clear Local Database (optional, or keep for offline cache).
    -   Redirect to Login.

## Acceptance Criteria
- [ ] Theme toggle works and persists.
- [ ] User details are displayed correctly from RxDB.
- [ ] Logout button returns user to Login screen.
