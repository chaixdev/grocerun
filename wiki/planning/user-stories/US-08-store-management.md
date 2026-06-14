# US-8: Store Catalog & Configuration

> *"As a user, I want to manage where I shop and how those stores are laid out."*

## Status
⚠️ **PARTIALLY IMPLEMENTED** (January 2026)

## Goal
Provide a catalog view to manage stores and a configuration interface to customize store details and section layouts.

## Implementation Status

### ✅ Completed Features
- **Catalog View**: `/stores` page lists all stores, grouped by household
- **Store Card**: Displays store name, location, and navigation to lists
- **Add Store**: Users can create stores within their households
- **Basic Store Config**: Name and location fields supported
- **Authorization**: Household-scoped access enforced
  - Users only see stores from their households
  - Cross-household isolation validated

### 🔲 Pending Features
- Store images/photos
- Section management UI (add, remove, reorder sections)
- Section-based item sorting in lists
- Store-specific item catalog

## Test Coverage

**E2E Tests:**
- **STORE-005** (apps/e2e/tests/stores/authorization.spec.ts): 
  - Validates store creation and household member visibility
- **STORE-006** (apps/e2e/tests/stores/authorization.spec.ts):
  - Validates cross-household store isolation
- **Security Tests** (apps/e2e/tests/security/xss.spec.ts):
  - XSS protection for store names
  - SQL injection protection for store search/filtering

**API Tests** (apps/e2e/tests/api/jwt.spec.ts):
- **API-002**: Household-scoped store access validation

## Technical Implementation

**Backend:**
- Schema: `Store` table with household foreign key, sections relation
- Actions: Store CRUD operations in `apps/web/src/actions/`
- Authorization: Household membership validated for all store operations

**Frontend:**
- Page: `apps/web/src/app/stores/page.tsx`
- Component: `HouseholdStoreGroup` for grouped display
- State Management: Server components with Server Actions

## Related Documentation
- [Test Scenarios](../test-scenarios.md) - STORE-001 through STORE-006
- [Domain Model](../../architecture/domain-model.md)

---

**Last Updated:** January 11, 2026
