# GRO-68: Add Rate Limiting to Sensitive Operations

**Phase:** 3 (Standardization)  
**Priority:** Medium  
**Audit Items:** #5  
**Depends On:** GRO-65, GRO-66  
**Blocks:** None

---

## Problem

Sensitive operations lack rate limiting:
- `createInvitation` - could be spammed to bloat database
- `createHousehold` - could create excessive resources
- Auth-related actions - potential for brute force

A malicious or compromised user could abuse these endpoints.

---

## Solution

Implement in-memory rate limiting for sensitive server actions using a simple token bucket or sliding window approach.

---

## Implementation Steps

### 1. Create Rate Limiter Utility

Create `src/core/utils/rate-limiter.ts`:

```typescript
interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  maxRequests: number  // Max requests allowed
  windowMs: number     // Time window in milliseconds
}

export function rateLimit(
  key: string, 
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanupExpired()
  }
  
  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs }
  }
  
  if (entry.count >= config.maxRequests) {
    // Rate limited
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  
  // Increment count
  entry.count++
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt }
}

function cleanupExpired() {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}

// Predefined configs
export const RATE_LIMITS = {
  invitation: { maxRequests: 10, windowMs: 60 * 60 * 1000 },  // 10 per hour
  household: { maxRequests: 5, windowMs: 60 * 60 * 1000 },    // 5 per hour
  default: { maxRequests: 100, windowMs: 60 * 1000 },         // 100 per minute
} as const
```

### 2. Create Rate Limit Decorator

Create `src/core/utils/with-rate-limit.ts`:

```typescript
import { ActionResult } from '@/core/types/action-result'
import { rateLimit, RateLimitConfig } from './rate-limiter'

export function withRateLimit<T extends unknown[], R>(
  action: (...args: T) => Promise<ActionResult<R>>,
  getUserId: () => Promise<string | null>,
  config: { key: string; limit: RateLimitConfig }
): (...args: T) => Promise<ActionResult<R>> {
  return async (...args: T) => {
    const userId = await getUserId()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const rateLimitKey = `${config.key}:${userId}`
    const result = rateLimit(rateLimitKey, config.limit)
    
    if (!result.allowed) {
      const resetIn = Math.ceil((result.resetAt - Date.now()) / 1000 / 60)
      return { 
        success: false, 
        error: `Rate limit exceeded. Try again in ${resetIn} minutes.` 
      }
    }
    
    return action(...args)
  }
}
```

### 3. Apply to createInvitation

Update `src/actions/invitation.ts`:

```typescript
import { rateLimit, RATE_LIMITS } from '@/core/utils/rate-limiter'
import { auth } from '@/core/auth'

export async function createInvitation(
  householdId: string
): Promise<ActionResult<Invitation>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }
  
  // Rate limit check
  const rateLimitResult = rateLimit(
    `invitation:${session.user.id}`,
    RATE_LIMITS.invitation
  )
  
  if (!rateLimitResult.allowed) {
    const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000 / 60)
    return { 
      success: false, 
      error: `You've created too many invitations. Try again in ${resetIn} minutes.` 
    }
  }
  
  // ... rest of implementation
}
```

### 4. Apply to createHousehold

Update `src/actions/household.ts`:

```typescript
import { rateLimit, RATE_LIMITS } from '@/core/utils/rate-limiter'

export async function createHousehold(
  data: HouseholdInput
): Promise<ActionResult<Household>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }
  
  // Rate limit check
  const rateLimitResult = rateLimit(
    `household:${session.user.id}`,
    RATE_LIMITS.household
  )
  
  if (!rateLimitResult.allowed) {
    return { 
      success: false, 
      error: 'You\'ve created too many households recently. Please try again later.' 
    }
  }
  
  // ... rest of implementation
}
```

---

## Rate Limit Configuration

| Operation | Limit | Window | Rationale |
|-----------|-------|--------|-----------|
| `createInvitation` | 10 | 1 hour | Prevent invitation spam |
| `createHousehold` | 5 | 1 hour | Prevent resource abuse |
| `createStore` | 20 | 1 hour | Reasonable store creation |
| `createList` | 50 | 1 hour | Higher volume expected |

---

## Acceptance Criteria

- [ ] Rate limiter utility created
- [ ] `createInvitation` rate limited (10/hour)
- [ ] `createHousehold` rate limited (5/hour)
- [ ] Clear error messages with reset time
- [ ] Rate limits are per-user
- [ ] `npm run build` passes
- [ ] Rate limiting works (manual test with rapid requests)

---

## Future Improvements

- Redis-backed rate limiting for multi-instance deployments
- IP-based rate limiting for unauthenticated endpoints
- Configurable limits via environment variables
- Rate limit headers in responses

---

## Notes

- In-memory rate limiting resets on server restart
- Sufficient for single-instance SQLite deployments
- For production scale, consider Upstash Rate Limit or similar
