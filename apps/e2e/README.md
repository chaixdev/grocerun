# E2E Testing

End-to-end testing with Playwright for the Grocerun application.

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run in UI mode
npm run test:ui
```

## Documentation

See [E2E Testing Setup Guide](../../wiki/development/e2e-testing-setup.md) for:

- Architecture and session injection pattern
- Setup instructions
- Writing tests
- Troubleshooting guide
- NextAuth v5 compatibility details

## Test Structure

Tests are organized by type (not domain) following our fixture-based testing philosophy:

```
tests/
├── core/                    # Isolated feature tests (80%)
│   ├── auth/               # Authentication tests
│   ├── stores/             # Store CRUD operations
│   ├── lists/              # List and shopping mode tests
│   ├── items/              # Item management tests
│   ├── onboarding/         # First-time user flows
│   ├── households/         # Household management
│   └── security/           # Security and authorization
├── integration/            # Feature combination tests (15%)
│   └── store-authorization.spec.ts  # Multi-user scenarios
└── journeys/               # End-to-end user flows (5%)
    └── first-shopping-experience.spec.ts  # Complete shopping journey
```

### Fixtures (Dependency Injection)

Fixtures provide prerequisites for tests, organized in a hierarchy:

```
authenticated (base)
  └── withHousehold (user has household)
      └── withStore (store created)
          └── withList (shopping list created)
              └── withItems (list has items)
                  └── withShoppingMode (list in shopping mode)
```

See [E2E Test Organization Guide](../../wiki/development/e2e-test-organization-guide.md) for philosophy and patterns.

### Helpers (Reusable Actions)

Helpers are proven functions extracted from core tests:

- **store-helpers.ts**: `createStore()`, `updateStore()`, `deleteStore()`
- **list-helpers.ts**: `createList()`, `addItemToList()`, `removeItemFromList()`
- **shopping-helpers.ts**: `startShopping()`, `checkOffItem()`, `completeShopping()`
- **auth.ts**: Session injection for authentication bypass

## Configuration

- **Config**: `playwright.config.ts`
- **Environment**: `.env.test` (copy from `.env.test.example`)
- **Fixtures**: `fixtures/` (authenticated, multi-user, withHousehold, withStore, etc.)
- **Helpers**: `helpers/` (store, list, shopping, auth utilities)
