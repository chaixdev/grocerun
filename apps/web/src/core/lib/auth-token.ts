/**
 * Client-side auth token manager.
 *
 * Fetches a signed JWT from /api/token (which calls getAuthJwt() server-side)
 * and stores it in memory. The token is attached to all API requests as a
 * Bearer token.
 *
 * See ADR 006 for rationale on this approach.
 */

let token: string | null = null
let refreshPromise: Promise<string | null> | null = null

/**
 * Get the current auth token, fetching one if needed.
 */
export async function getToken(): Promise<string | null> {
  if (token) return token
  return refreshToken()
}

/**
 * Fetch a fresh token from the server.
 * Deduplicates concurrent calls — if a refresh is already in flight,
 * subsequent callers get the same promise.
 */
export async function refreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = fetchToken()
  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

async function fetchToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/token')
    if (!res.ok) {
      token = null
      return null
    }
    const data = await res.json()
    token = data.token
    return token
  } catch {
    token = null
    return null
  }
}

/**
 * Clear the stored token (e.g. on logout).
 */
export function clearToken() {
  token = null
}
