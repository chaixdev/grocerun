import { redirect } from '@tanstack/react-router'
import { isAuthenticated } from './session'
import { getOidc } from './oidc'

/**
 * Route guard: allow the route through when a valid app auth exists,
 * otherwise redirect to /login.
 *
 * Fast path (sync): check test token / localStorage cache.
 * Slow path (async): check live OIDC state — needed during the
 * post-login window before persistLiveSession() has written the cache.
 */
export async function requireAuth(): Promise<void> {
  if (isAuthenticated()) return
  // Cache miss — could be a fresh post-login where persistLiveSession
  // hasn't run yet. Check live OIDC.
  try {
    const oidc = await getOidc()
    if (oidc.isUserLoggedIn) return
  } catch { /* fall through to redirect */ }

  throw redirect({ to: '/login' })
}
