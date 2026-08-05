/**
 * React auth hook — the only React consumer of OIDC state (GROCERUN-69).
 *
 * Wraps `useOidc()` and normalises the oidc-spa union type into a stable,
 * application-facing shape. All components must obtain auth state through
 * `useAuth()`; imperative code (route guards, api, database) uses the session
 * helpers from session.ts.
 *
 * Login redirects are owned by the router (`beforeLoad` guards) — this hook
 * only starts the OIDC login flow.
 */

import { useEffect, useRef } from 'react'
import { useOidc } from '@/core/auth/oidc'
import {
  logout as sessionLogout,
  persistLiveSession,
  isAuthenticated as sessionIsAuthenticated,
  type AppAuthUser,
} from '@/core/auth/session'
import { markAuthFallbackAvailable, getCachedUser } from '@/core/auth/token-cache'

export type UseAuthState = {
  isAuthenticated: boolean
  isLoading: boolean
  initializationError: unknown
  user: AppAuthUser | null
  accountKey: string | null
  login: () => void
  logout: () => void
}

export function useAuth(): UseAuthState {
  const oidc = useOidc()

  // isAuthenticated prefers live OIDC state but falls back to the session
  // cache during restoration windows (e.g. oidc-spa "full page redirect"
  // hasn't completed yet but localStorage still holds a fresh token).
  const oidcAuthed = oidc.isUserLoggedIn === true
  const isAuthenticated = oidcAuthed || sessionIsAuthenticated()

  // useOidc() throws while OIDC is still initialising — the
  // OidcInitializationGate renders its fallback during that window — so by the
  // time this hook runs the state is settled. The check is kept defensively in
  // case the upstream API ever surfaces an unsettled value.
  const isLoading = oidc.isUserLoggedIn === undefined

  // user: prefer live OIDC claims, fall back to cached user during restoration.
  const user: AppAuthUser | null = oidcAuthed
    ? oidc.decodedIdToken
    : getCachedUser() ?? null
  const accountKey = user?.sub ?? null

  // Persist the live session so the sync, cache-based session layer (guards,
  // api, database) stays consistent with live OIDC state, and mark the
  // auth-fallback flag (test mode / offline startup).
  useEffect(() => {
    if (!oidc.isUserLoggedIn) return
    markAuthFallbackAvailable()
    void persistLiveSession()
  }, [oidc.isUserLoggedIn])

  // Account-change detection: when `sub` flips between two non-null values
  // (e.g. a different Google account is silently active), hard-reload so RxDB
  // re-initialises cleanly under the new account scope (ADR 007). The reload
  // happens before any event listener could react, so the reload itself is the
  // whole mechanism — no 'account-changed' event is emitted here.
  const currentSub = user?.sub ?? null
  const prevSubRef = useRef<string | null>(null)
  useEffect(() => {
    const prevSub = prevSubRef.current
    if (prevSub !== null && currentSub !== null && prevSub !== currentSub) {
      window.location.replace(window.location.href)
      return
    }
    prevSubRef.current = currentSub
  }, [currentSub])

  const login = (): void => {
    if (!oidc.isUserLoggedIn) {
      void oidc.login({ redirectUrl: '/lists' })
    }
  }

  const logout = (): void => {
    // Emits the 'logout' event + clears cached auth + sets the reseed block.
    sessionLogout()
    // Leave the OIDC provider. When not logged in (mock mode), fall back to
    // navigating directly to /login.
    if (oidc.isUserLoggedIn) {
      void oidc.logout({ redirectTo: 'home' })
    } else {
      window.location.replace('/login')
    }
  }

  return {
    isAuthenticated,
    isLoading,
    initializationError: oidc.initializationError ?? null,
    user,
    accountKey,
    login,
    logout,
  }
}
