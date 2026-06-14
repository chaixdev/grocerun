# US-3: Household Collaboration

> *"As a user, I want to have a common view on lists for my household."*

## Status
✅ **IMPLEMENTED** (January 2026)

## Goal
Enable multiple household members to share stores and lists, with real-time updates during shopping.

## Implementation Status

### ✅ Completed Features
- **Generate Invite**: Users can generate single-use invitation tokens via Settings page
- **Share Invite**: Token is displayed in a copyable input field
- **Join Household**: Users paste token in Settings → "Enter invitation code" → confirm dialog
- **Validation**: System enforces token expiration (24h default, configurable) and one-time use
- **Visibility**: New members immediately see shared stores and lists
- **Household Roles**: Users can be owners or members of households
- **Leave Household**: Members can leave households they don't own

### 🔲 Pending Features
- Real-Time Sync (currently requires page refresh)

## Test Coverage

**E2E Tests** (apps/e2e/tests/stores/authorization.spec.ts):
- **STORE-005**: Validates household member access to shared stores
  - User A generates invitation → User B joins → Both see same stores
- **STORE-006**: Validates cross-household isolation
  - Users in different households cannot see each other's stores

**API Tests** (apps/e2e/tests/api/jwt.spec.ts):
- **API-002**: Validates household-scoped authorization at API level

## Technical Implementation

**Backend:**
- Schema: `Invitation` table with token, household, expiration
- Actions: `createInvitation`, `joinHousehold`, `getInvitationDetails`
- See: [ADR-003: JWT Authentication](../../adr/003-jwt-authentication.md)

**Frontend:**
- Component: `InvitationManager` (apps/web/src/features/households/components/Invitations/)
- Location: Embedded in Settings page (`/settings`)
- Flow: Invitation management happens within settings, not dedicated `/invite/[token]` route

## Related Documentation
- [Household Invitation System Design](../../design/household-invitation-system.md)
- [Test Scenarios](../test-scenarios.md) - STORE-005, STORE-006
- [Phase 2 Migration Plan](../PHASE-2-MIGRATION.md)

---

**Last Updated:** January 11, 2026
