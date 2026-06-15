type CachedAuthUser = {
  sub: string
  name?: string
  email?: string
  picture?: string
}

type CachedAuth = {
  accessToken: string
  user: CachedAuthUser
  expiresAt: number
}

const AUTH_TOKEN_CACHE_KEY = 'grocerun:auth-token-cache'
const AUTH_FALLBACK_KEY = 'grocerun:auth-fallback'
const AUTH_LOGOUT_IN_PROGRESS_KEY = 'grocerun:auth-logout-in-progress'
const AUTH_CACHE_EXPIRY_SKEW_MS = 60_000
const AUTH_LOGOUT_RESEED_BLOCK_MS = 30_000

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) return null
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

function getTokenExpiresAt(token: string): number | null {
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') return null
  return payload.exp * 1000
}

function isFresh(expiresAt: number): boolean {
  return expiresAt > Date.now() + AUTH_CACHE_EXPIRY_SKEW_MS
}

export function clearCachedAuth(): void {
  try { localStorage.removeItem(AUTH_TOKEN_CACHE_KEY) } catch { /* noop */ }
}

export function markAuthFallbackAvailable(): void {
  try { localStorage.setItem(AUTH_FALLBACK_KEY, 'true') } catch { /* noop */ }
}

export function consumeAuthFallbackFlag(): boolean {
  try {
    if (localStorage.getItem(AUTH_FALLBACK_KEY) !== 'true') return false
    localStorage.removeItem(AUTH_FALLBACK_KEY)
    return true
  } catch {
    return false
  }
}

export function hasRecentLogoutInProgress(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_LOGOUT_IN_PROGRESS_KEY)
    if (!raw) return false
    const startedAt = Number(raw)
    if (!Number.isFinite(startedAt)) {
      localStorage.removeItem(AUTH_LOGOUT_IN_PROGRESS_KEY)
      return false
    }
    if (Date.now() - startedAt > AUTH_LOGOUT_RESEED_BLOCK_MS) {
      localStorage.removeItem(AUTH_LOGOUT_IN_PROGRESS_KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}

export function beginAuthLogout(): void {
  clearCachedAuth()
  try {
    localStorage.removeItem(AUTH_FALLBACK_KEY)
    localStorage.setItem(AUTH_LOGOUT_IN_PROGRESS_KEY, String(Date.now()))
  } catch { /* noop */ }
}

export function clearAuthLogoutMarker(): void {
  try { localStorage.removeItem(AUTH_LOGOUT_IN_PROGRESS_KEY) } catch { /* noop */ }
}

export function writeCachedAuth(params: { accessToken: string; user: CachedAuthUser }): void {
  if (hasRecentLogoutInProgress()) return
  const expiresAt = getTokenExpiresAt(params.accessToken)
  if (!expiresAt || !isFresh(expiresAt)) {
    clearCachedAuth()
    return
  }

  try {
    clearAuthLogoutMarker()
    localStorage.setItem(AUTH_TOKEN_CACHE_KEY, JSON.stringify({
      accessToken: params.accessToken,
      user: params.user,
      expiresAt,
    } satisfies CachedAuth))
  } catch { /* storage unavailable */ }
}

export function readCachedAuth(): CachedAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_TOKEN_CACHE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<CachedAuth>
    if (
      typeof value.accessToken !== 'string' ||
      typeof value.expiresAt !== 'number' ||
      !value.user ||
      typeof value.user.sub !== 'string'
    ) {
      clearCachedAuth()
      return null
    }
    if (!isFresh(value.expiresAt)) {
      clearCachedAuth()
      return null
    }
    return value as CachedAuth
  } catch {
    clearCachedAuth()
    return null
  }
}

export function getCachedAccessToken(): string | null {
  return readCachedAuth()?.accessToken ?? null
}

export function getCachedUser(): CachedAuthUser | null {
  return readCachedAuth()?.user ?? null
}
