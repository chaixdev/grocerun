# ADR 003: JWT Authentication for API Layer

**Status:** Accepted  
**Date:** 2026-01-09  
**Deciders:** Development Team  
**Context:** Phase 2 - API Proxy Layer Authentication Strategy

---

## Context

Phase 2 introduces a NestJS API layer that Next.js Server Actions will call. We need authentication to:
- Identify which user is making the request
- Protect endpoints from unauthorized access
- Maintain user context across all 37 server actions

The authentication must work seamlessly across:
- **Phase 2:** Server Actions → NestJS API
- **Phase 3:** Browser → NestJS API (client-side fetching)
- **Phase 4:** RxDB sync → NestJS API (background sync)

---

## Decision

**We will use JWT (JSON Web Tokens) for API authentication**, leveraging NextAuth's existing JWT implementation.

### Implementation Strategy

#### 1. Token Generation (Already Done)
NextAuth already generates JWTs signed with `AUTH_SECRET`:
- User signs in with Google OAuth
- NextAuth creates JWT with user ID, email, name
- JWT stored in HTTP-only cookie (`next-auth.session-token`)

#### 2. Token Validation (NestJS)
Create reusable authentication infrastructure:
```typescript
// apps/server/src/auth/auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  // Validates JWT, extracts user, attaches to request
}

// Usage in controllers:
@UseGuards(AuthGuard)
@Patch('/users/me')
updateProfile(@CurrentUser() user: User) {
  // user.id, user.email available
}
```

#### 3. Token Forwarding (Next.js)
Update API client to include auth token:
```typescript
// Server Action gets session
const session = await auth()
const token = session?.accessToken

// Forward to API
apiClient.patch('/users/me', data, schema, { token })
```

---

## Options Considered

### Option 1: Custom X-User-ID Header ❌
**Approach:** Server Action passes `X-User-ID: <userId>` header

**Pros:**
- Simple to implement
- No JWT library needed

**Cons:**
- ⛔ Insecure: Any request can claim to be any user
- ⛔ Won't work in Phase 3 (client can't be trusted)
- ⛔ No expiration, no signature validation
- ⛔ Doesn't leverage existing NextAuth infrastructure

### Option 2: Session Cookie Forwarding ❌
**Approach:** Forward NextAuth session cookie from Server Action to NestJS

**Pros:**
- Reuses existing session

**Cons:**
- ⛔ HTTP-only cookies not accessible in Server Actions
- ⛔ Cookie domain issues (localhost:3000 vs localhost:3001)
- ⛔ Fragile across deployment environments

### Option 3: JWT with NextAuth Integration ✅ (Chosen)
**Approach:** Extract JWT from NextAuth session, validate in NestJS

**Pros:**
- ✅ Secure: Cryptographically signed tokens
- ✅ Stateless: No session storage needed in NestJS
- ✅ Works across all phases (2, 3, 4)
- ✅ Leverages existing NextAuth infrastructure
- ✅ Industry standard (OAuth 2.0, OpenID Connect)
- ✅ Built-in expiration and refresh logic

**Cons:**
- Requires sharing `AUTH_SECRET` between Next.js and NestJS
- Slightly more complex setup (mitigated by reusable guard)

---

## Rationale

### 1. Future-Proof for Phase 3 & 4
**Phase 3 (Client-Side Fetching):**
When we move to React Query, the browser needs to authenticate:
```typescript
// Phase 3: Browser makes API call directly
useQuery(['profile'], () => 
  fetch('/api/v1/users/me', {
    credentials: 'include' // Sends HTTP-only cookie
  })
)
```

NestJS reads JWT from cookie header (same validation logic as Phase 2).

**Phase 4 (RxDB Sync):**
Background sync needs authentication:
```typescript
// Phase 4: RxDB replication
const replicationState = replicateRxCollection({
  url: 'http://api/sync',
  headers: () => ({
    Authorization: `Bearer ${getSessionToken()}`
  })
})
```

Same JWT validation, user context maintained.

### 2. Security Best Practices
JWT provides:
- **Signature verification:** Can't be forged without `AUTH_SECRET`
- **Expiration:** Tokens auto-expire (NextAuth default: 30 days)
- **Claims validation:** Check issuer, audience, expiration
- **Tamper detection:** Any modification invalidates signature

### 3. Leverages Existing Infrastructure
NextAuth already:
- Generates JWTs on login
- Handles token refresh
- Manages session lifecycle
- Integrates with Google OAuth

We just need to **consume** what's already there.

### 4. Stateless API Design
NestJS doesn't need:
- Session storage (Redis, database)
- Sticky sessions
- Session synchronization

Each request is self-contained with user context in JWT.

---

## Implementation Details

### Shared Secret Configuration

**apps/web/.env (existing):**
```env
AUTH_SECRET=<your-secret-key>
```

**apps/server/.env (add):**
```env
AUTH_SECRET=<same-secret-key>
JWT_ISSUER=http://localhost:3000
```

**Important:** Use same `AUTH_SECRET` in both apps for signature validation.

### NextAuth JWT Structure
```json
{
  "sub": "user_cluid123", // User ID
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "iat": 1704844800, // Issued at
  "exp": 1707436800, // Expires at
  "iss": "http://localhost:3000" // Issuer
}
```

### NestJS Auth Guard Pattern
```typescript
// Reusable for all endpoints
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  @Patch('/me')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto
  ) {
    // user.sub = user ID
    // user.email, user.name available
  }
}
```

### API Client Token Forwarding
```typescript
// apps/web/src/core/lib/api-client.ts
async function request(endpoint, options, schema, authToken?) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
  }
  // ... rest of implementation
}
```

---

## Consequences

### Positive
- ✅ **Security:** Industry-standard authentication
- ✅ **Consistency:** Same auth mechanism across all phases
- ✅ **Stateless:** Scales horizontally without session storage
- ✅ **Developer experience:** Reusable `@UseGuards(AuthGuard)` decorator
- ✅ **Integration:** Works with NextAuth, Google OAuth out-of-the-box
- ✅ **Future-ready:** Supports Phase 3 (browser) and Phase 4 (RxDB sync)

### Negative
- ❌ **Secret sharing:** `AUTH_SECRET` must be identical in both apps
- ❌ **Token size:** JWTs are larger than simple headers (minimal impact)
- ❌ **Complexity:** More setup than custom header (but reusable)

### Mitigation Strategies
1. **Secret management:** Document in `.env.example`, use env vars in production
2. **Token size:** Acceptable trade-off for security
3. **Complexity:** Create reusable guard, document pattern for future endpoints

---

## Migration Path

### Phase 2 (Current)
```
Server Action → Extract JWT → NestJS API
                ↓
            Validate JWT → User context
```

### Phase 3 (Client-Side)
```
Browser → HTTP-only cookie → NestJS API
          (NextAuth auto-sends)  ↓
                            Validate JWT → User context
```

### Phase 4 (RxDB Sync)
```
RxDB sync → Get session token → NestJS API
            ↓
        Authorization header → Validate JWT → User context
```

**Same validation logic, different token sources.**

---

## Testing Strategy

### Unit Tests
- Verify JWT signature validation
- Test expired token rejection
- Test invalid issuer rejection

### Integration Tests
- Server Action → API → Database (with real JWT)
- Verify user context extraction
- Test unauthorized request rejection

### Manual Testing
- Sign in with Google OAuth
- Update profile via API
- Verify changes in database
- Check auth failures (invalid/missing token)

---

## References

- [NextAuth JWT Documentation](https://next-auth.js.org/configuration/options#jwt)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Phase 2 Migration Plan](../planning/phase-2-api-proxy.md)

---

**Decision Date:** January 9, 2026  
**Review Date:** Before Phase 3 (validate browser integration)  
**Status:** Active
