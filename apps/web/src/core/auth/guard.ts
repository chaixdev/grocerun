import { redirect } from '@tanstack/react-router'
import { isAuthenticated } from './session'

/**
 * Route guard: allow the route through when a valid app auth exists,
 * otherwise redirect to /login. Sync — `isAuthenticated()` reads the
 * session cache / test token directly (no OIDC await needed).
 */
export function requireAuth(): void {
  if (isAuthenticated()) return
  throw redirect({ to: '/login' })
}

