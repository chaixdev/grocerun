/**
 * Public auth facade (GROCERUN-69).
 *
 * Single import surface for application auth. Consumers should import from
 * `@/core/auth` rather than reaching into individual auth modules:
 *
 * - React components: `useAuth()` for reactive OIDC-backed state
 * - Route guards: `requireAuth()`
 * - Imperative code (api, database, sync): session helpers
 *
 * `useOidc` is deliberately NOT exported here — use-auth.ts is the only React
 * consumer of OIDC state.
 */

export {
  isAuthenticated,
  getAccessToken,
  refreshAccessToken,
  getAccountKey,
  persistLiveSession,
  logout,
  invalidateSession,
  onSessionChange,
  getApiUrl,
  getSyncUrl,
  getStreamUrl,
} from './session'
export type { AppAuthUser, SessionEvent } from './session'
export { requireAuth } from './guard'
export { useAuth } from './use-auth'
// Internal but available through the barrel for the app shell and session layer.
export { bootstrapOidc, getOidc, OidcInitializationGate } from './oidc'
export { isTokenFresh } from './token-cache'
