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

```
tests/
├── app.spec.ts              # Basic smoke tests
├── auth/                    # Authentication flow tests
├── households/              # Household management tests
└── EXAMPLES.spec.ts         # Test templates for all scenarios
```

## Configuration

- **Config**: `playwright.config.ts`
- **Environment**: `.env.test` (copy from `.env.test.example`)
- **Fixtures**: `fixtures/` (authenticated users, multi-user contexts)
- **Helpers**: `helpers/` (session injection utilities)
