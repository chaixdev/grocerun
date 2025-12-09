# GRO-54: Set Up Testing Infrastructure

**Phase:** 1 (Foundation)  
**Priority:** High  
**Audit Item:** #29  
**Depends On:** None  
**Blocks:** All Phase 2 tickets

---

## Problem

The codebase has no testing infrastructure:
- No test files (`*.test.ts`, `*.spec.ts`)
- No testing dependencies in `package.json`
- No test configuration
- Refactoring without tests is risky

---

## Solution

Set up Vitest (fast, ESM-native, Next.js compatible) with initial smoke tests.

---

## Implementation Steps

### 1. Install Dependencies

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

### 2. Create Vitest Config

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 3. Create Test Setup File

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

### 4. Add Test Scripts to package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 5. Create Initial Smoke Tests

Create `src/actions/__tests__/household.test.ts` with basic structure tests.

---

## Acceptance Criteria

- [ ] `npm run test` executes without errors
- [ ] At least one passing test exists
- [ ] Vitest config resolves `@/` path aliases
- [ ] Test setup file initializes jest-dom matchers
- [ ] CI-compatible `test:run` script added

---

## Notes

- Start with server action tests (no React rendering needed)
- Component tests can be added incrementally
- Consider Playwright for E2E later (separate ticket)
