/**
 * Application authentication session — single authority for all auth state.
 *
 * - Imperative API: session.ts (no React dependency — usable from guard,
 *   api, database, and other non-React code)
 * - React hook: use-auth.ts (wraps useOidc, only React consumer of OIDC state)
 *
 * This file is the SOLE module that reads __grocerun_test_token__.
 * Consumers (api.ts, database.ts, etc.) never import the key directly.
 */

import { getOidc } from './oidc'
import {
  beginAuthLogout,
  clearCachedAuth,
  getCachedAccessToken,
  getCachedUser,
  readCachedAuth,
  writeCachedAuth,
} from './token-cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppAuthUser = {
  sub: string
  name?: string
  email?: string
  picture?: string
}

export type SessionEvent =
  | { type: 'logout' }
  | { type: 'invalidated' }

// ---------------------------------------------------------------------------
// Event emitter (same Set-based pattern as core/diagnostics/event-bus.ts)
// ---------------------------------------------------------------------------

type SessionListener = (event: SessionEvent) => void
const sessionListeners = new Set<SessionListener>()

function emitSessionChange(event: SessionEvent): void {
  for (const fn of sessionListeners) {
    try { fn(event) } catch { /* never let a listener crash the session layer */ }
  }
}

/** Subscribe to session lifecycle events. Returns an unsubscribe function. */
export function onSessionChange(fn: SessionListener): () => void {
  sessionListeners.add(fn)
  return () => { sessionListeners.delete(fn) }
}

// ---------------------------------------------------------------------------
// Test token (sole owner of __grocerun_test_token__)
// ---------------------------------------------------------------------------

const TEST_TOKEN_KEY = '__grocerun_test_token__'

function getTestToken(): string | null {
  if (typeof window === 'undefined') return null
  try { return sessionStorage.getItem(TEST_TOKEN_KEY) } catch { return null }
}

/** Exported for OIDC bootstrap layer — see __root.tsx. */
export function isTestMode(): boolean {
  return getTestToken() !== null
}

// ---------------------------------------------------------------------------
// Authentication check (sync)
// ---------------------------------------------------------------------------

/**
 * Synchronous check: is the user currently authenticated?
 *
 * Priority: test token → fresh localStorage cache.
 * The cache is populated by persistLiveSession() after OidcInitializationGate
 * resolves — by the time any route guard or component runs, the cache
 * reflects live OIDC state.
 */
export function isAuthenticated(): boolean {
  // 1. Test token bypass (Playwright)
  if (getTestToken()) return true

  // 2. Fresh localStorage cache (written by persistLiveSession)
  return readCachedAuth() !== null
}

// ---------------------------------------------------------------------------
// Token retrieval (consolidated — handles test token internally)
// ---------------------------------------------------------------------------

/**
 * Resolve an access token for API calls.
 * Test token takes priority → live OIDC token → cached fallback.
 * Caches the live token to localStorage on successful OIDC retrieval.
 */
export async function getAccessToken(): Promise<string | null> {
  const testToken = getTestToken()
  if (testToken) return testToken

  try {
    const oidc = await getOidc()
    if (oidc.isUserLoggedIn) {
      const accessToken = await oidc.getAccessToken()
      writeCachedAuth({ accessToken, user: oidc.getDecodedIdToken() })
      return accessToken
    }
  } catch { /* fall through to cache */ }

  return getCachedAccessToken()
}

/**
 * Force-refresh the access token (renews the OIDC session).
 * Test token takes priority → OIDC renew → null if neither works.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const testToken = getTestToken()
  if (testToken) return testToken

  try {
    const oidc = await getOidc()
    if (oidc.isUserLoggedIn) {
      await oidc.renewTokens()
      const accessToken = await oidc.getAccessToken()
      writeCachedAuth({ accessToken, user: oidc.getDecodedIdToken() })
      return accessToken
    }
  } catch { /* fall through */ }

  return null
}

// ---------------------------------------------------------------------------
// Account identity
// ---------------------------------------------------------------------------

/**
 * Returns the current user's `sub` claim, or null if not authenticated.
 * Needed by GROCERUN-62 for account-scoped RxDB.
 */
export function getAccountKey(): string | null {
  const testToken = getTestToken()
  if (testToken) {
    try {
      const parts = testToken.split('.')
      if (parts.length !== 3 || !parts[1]) return null
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      if (typeof payload.sub === 'string') return payload.sub
      return null
    } catch { return null }
  }

  const cachedUser = getCachedUser()
  if (cachedUser) return cachedUser.sub

  return null
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/**
 * Persist the current live OIDC session to the localStorage cache.
 * Called from __root.tsx after OidcInitializationGate resolves.
 */
export async function persistLiveSession(): Promise<void> {
  try {
    const oidc = await getOidc()
    if (!oidc.isUserLoggedIn) return

    const accessToken = await oidc.getAccessToken()
    writeCachedAuth({ accessToken, user: oidc.getDecodedIdToken() })
  } catch { /* noop */ }
}

/**
 * Imperative logout: emit 'logout' event + clear localStorage cache +
 * set reseed block. The caller (use-auth.ts) handles the OIDC provider
 * redirect after this returns.
 */
export function logout(): void {
  emitSessionChange({ type: 'logout' })
  beginAuthLogout()
}

/**
 * Invalidate the current session — clear cache and emit 'invalidated' event.
 * No reseed guard (unlike logout), since this is a server-driven invalidation
 * (e.g. 401 response, token expired).
 */
export function invalidateSession(): void {
  clearCachedAuth()
  emitSessionChange({ type: 'invalidated' })
}

// ---------------------------------------------------------------------------
// URL construction (centralised endpoint resolution)
// ---------------------------------------------------------------------------

const API_BASE = '/api/v1'

export function getApiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

export function getSyncUrl(collection: string, operation: 'pull' | 'push'): string {
  return `${API_BASE}/sync/${collection}/${operation}`
}

export function getStreamUrl(): string {
  return `${API_BASE}/sync/stream`
}


