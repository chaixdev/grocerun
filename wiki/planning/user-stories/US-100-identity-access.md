# US-100: Identity & Access

> *"As a user, I want to securely log in and manage my household so that I can collaborate with my family."*

## Goal
Establish the secure foundation of the app: identifying who the user is and which household they belong to. This is the prerequisite for all data synchronization.

## Acceptance Criteria
- [ ] **Authentication**: User can log in via a secure method (e.g., Magic Link or Password).
- [ ] **Household Identity**: Every user belongs to exactly one active Household.
- [ ] **Invitation**: Users can invite others to their household via a secure token.
- [ ] **Persistence**: Login state persists across reloads (JWT/Session).
- [ ] **Sync Security**: Only authenticated users can access the sync endpoints.

## Tickets
| ID | Title | Status |
|---|---|---|
| GRO-110 | User & Household Domain (Schema) | 🔲 TODO |
| GRO-120 | Authentication System (JWT + UI) | 🔲 TODO |
| GRO-132 | Household Invitations | 🔲 TODO |
