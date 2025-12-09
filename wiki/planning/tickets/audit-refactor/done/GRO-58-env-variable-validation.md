# GRO-58: Add Environment Variable Validation

**Phase:** 1 (Foundation)  
**Priority:** Medium  
**Audit Item:** #18  
**Depends On:** None  
**Blocks:** None (but should complete before refactor for stability)

---

## Problem

Environment variables are accessed directly via `process.env` without validation:
- `DATABASE_URL` in `src/lib/prisma.ts`
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` in `src/auth.config.ts`
- `AUTH_SECRET` for NextAuth

Missing or misconfigured variables cause cryptic runtime errors instead of clear startup failures.

---

## Solution

Use Zod to validate environment variables at startup, failing fast with clear error messages.

---

## Implementation Steps

### 1. Create Environment Schema

Create `src/lib/env.ts`:

```typescript
import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Auth
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  AUTH_GOOGLE_ID: z.string().min(1, 'AUTH_GOOGLE_ID is required'),
  AUTH_GOOGLE_SECRET: z.string().min(1, 'AUTH_GOOGLE_SECRET is required'),
  
  // Optional
  AUTH_TRUST_HOST: z.string().optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  
  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

function validateEnv() {
  const result = envSchema.safeParse(process.env)
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error(result.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }
  
  return result.data
}

export const env = validateEnv()
```

### 2. Update Imports

Replace direct `process.env` access with `env` import:

**src/lib/prisma.ts:**
```typescript
import { env } from './env'

// Use env.DATABASE_URL instead of process.env.DATABASE_URL
```

**src/auth.config.ts:**
```typescript
import { env } from '@/lib/env'

// Use env.AUTH_GOOGLE_ID, env.AUTH_GOOGLE_SECRET
```

### 3. Add Type Safety

The `env` object will be fully typed based on the Zod schema.

---

## Acceptance Criteria

- [ ] `src/lib/env.ts` created with Zod schema
- [ ] All required env vars validated at startup
- [ ] Missing env vars produce clear error messages
- [ ] Direct `process.env` access replaced with `env` import
- [ ] `npm run build` passes
- [ ] App fails fast with missing env vars (test by removing one)

---

## Notes

- Consider `@t3-oss/env-nextjs` as an alternative (more Next.js specific)
- Server-only env vars should not be prefixed with `NEXT_PUBLIC_`
- This creates a single source of truth for env var requirements
