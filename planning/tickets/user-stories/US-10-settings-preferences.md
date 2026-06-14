# US-10: Settings & Preferences

> *"As a user, I want to manage my account and application preferences."*

## Status
⚠️ **PARTIALLY IMPLEMENTED** (Updated June 2026)

## Goal
Provide a settings area for user profile management, theme preferences, and household management.

## Implementation Status

### ✅ Completed Features
- **Settings Page**: `/settings` route implemented
- **Household Management**: 
  - View all households (owner/member badge)
  - Create new households
  - Generate invitation codes
  - Join households via invitation code
  - Leave households (for members)
  - Rename households (for owners)
  - Delete households (for owners, if no other members)
- **Sign Out**: Secure logout with session destruction
- **Protected Access**: Settings page requires authentication
- **Theme Toggle**: Dark/light/system mode via `next-themes` (`ModeToggle` component, `ThemeProvider` in root layout)

### 🔲 Pending Features
- Profile editing (name, avatar)
- Additional preferences (language, notifications, etc.)

## Test Coverage

**E2E Tests:**
- **AUTH-004** (apps/e2e/tests/auth/logout.spec.ts):
  - Logout from settings page
  - Session destruction validation
- **AUTH-006** (apps/e2e/tests/auth/protected-routes.spec.ts):
  - `/settings` redirects unauthenticated users to login
- **STORE-005, STORE-006** (apps/e2e/tests/stores/authorization.spec.ts):
  - Invitation flow via settings page
  - Household leaving via settings page

## Technical Implementation

**Backend:**
- Page: `apps/web/src/app/settings/page.tsx`
- Component: `SettingsForm` with `InvitationManager` embedded
- Actions: Household CRUD, invitation management
- See: [ADR-003: JWT Authentication](../../adr/003-jwt-authentication.md)

**Frontend:**
- Component: `InvitationManager` (apps/web/src/features/households/components/Invitations/)
- State: Server-side data fetching with Prisma
- Interactions: Dialog-based workflows for household operations

## Related Documentation
- [Test Scenarios](../test-scenarios.md) - AUTH-004, AUTH-006
- [Household Invitation System](../../design/household-invitation-system.md)

---

**Last Updated:** June 14, 2026
