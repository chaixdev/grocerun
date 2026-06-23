import { useEffect, useState } from 'react'
import { Outlet, createRootRoute, Link } from '@tanstack/react-router'
import { Header } from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'
import { ResponsiveShell } from '@/components/layout/responsive-shell'
import { Toaster } from '@/components/ui/sonner'
import { DiagnosticsGate } from '@/components/diagnostics-gate'
import { PageLoading } from '@/components/ui/page-loading'
import { ErrorComponent } from '@/components/error-boundary'
import { bootstrapOidc, useOidc, OidcInitializationGate } from '@/core/auth/oidc'
import { resolveOidcConfig } from '@/core/auth/oidc-config'
import { getCachedAppUser, persistLiveOidcSession } from '@/core/auth/session'
import { consumeAuthFallbackFlag, markAuthFallbackAvailable } from '@/core/auth/token-cache'
import { api } from '@/core/lib/api'

const TEST_TOKEN_KEY = '__grocerun_test_token__'
const isTestMode = typeof window !== 'undefined'
  && (() => { try { return sessionStorage.getItem(TEST_TOKEN_KEY) !== null } catch { return false } })()

declare global {
  interface Window {
    __GROCERUN_CONFIG__?: {
      clientId: string;
      clientSecret?: string;
      issuerUri?: string;
    };
  }
}

const oidcConfig = window.__GROCERUN_CONFIG__ ?? {
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
  clientSecret: import.meta.env.VITE_OIDC_CLIENT_SECRET,
  issuerUri: import.meta.env.VITE_OIDC_ISSUER_URI,
};

const { issuerUri: ISSUER_URI, isGoogle, bootstrapConfig } = resolveOidcConfig(oidcConfig, {});

if (oidcConfig.clientSecret && !isGoogle) {
  console.warn('[grocerun] clientSecret is set but issuer is not Google — secret will be ignored. Standard OIDC providers use PKCE without a client secret.')
}

if (isTestMode) {
  console.warn('[grocerun] Test mode detected — bootstrapping OIDC with mock implementation')
}
bootstrapOidc(
  isTestMode
    ? {
        implementation: "mock",
        isUserInitiallyLoggedIn: true,
        BASE_URL: import.meta.env.BASE_URL,
        decodedIdToken_mock: {
          sub: 'test-playwright-user',
          name: 'Playwright Test User',
          email: 'test@playwright.dev',
        },
      }
    : {
        ...bootstrapConfig,
        sessionRestorationMethod: "full page redirect",
        BASE_URL: import.meta.env.BASE_URL,
        scopes: ["profile", "email"],
      }
)

function NotFoundPage() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-lg text-muted-foreground">This page doesn&apos;t exist.</p>
      <Link to="/" className="text-sm text-primary hover:underline">
        Go home
      </Link>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  const content = isTestMode ? <TestShell /> : (
    <OidcInitializationGate fallback={<PageLoading />}>
      <AuthenticatedShell />
    </OidcInitializationGate>
  );
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {content}
    </ThemeProvider>
  )
}

/** Test-mode shell — provides synthetic user data without requiring oidc-spa. */
function TestShell() {
  const testUser = { name: 'Test User', email: 'test@playwright.dev' }
  return (
    <>
      <Header user={testUser} />
      <ResponsiveShell user={testUser}>
        <Outlet />
      </ResponsiveShell>
      <Toaster />
      <DiagnosticsGate />
    </>
  )
}

function getOidcSpaAuthState(): string | null {
  try {
    const configId = `${ISSUER_URI}:${oidcConfig.clientId}`
    const raw = localStorage.getItem(`oidc-spa:auth-state:${configId}`)
    return raw
  } catch {
    return null
  }
}

function AuthenticatedShell() {
  const oidc = useOidc()

  // Fetch DB user profile for avatar/name — prefers DB values over OIDC
  // token claims so that profile edits (e.g. updated avatar URL) are
  // reflected in the app bar.  Falls back to OIDC claims while loading
  // or if the API call fails.
  const [dbUser, setDbUser] = useState<{ name: string | null; image: string | null } | undefined>()
  useEffect(() => {
    if (!oidc.isUserLoggedIn) return
    let cancelled = false
    api.get<{ name: string | null; image: string | null }>('/users/me')
      .then((u) => { if (!cancelled) setDbUser(u) })
      .catch((err) => { if (!cancelled) console.error('[grocerun] Failed to load DB user for app bar:', err) })
    return () => { cancelled = true }
  }, [oidc.isUserLoggedIn])

  // Persist backup flag when successfully logged in
  useEffect(() => {
    if (oidc.isUserLoggedIn) {
      markAuthFallbackAvailable()
      void persistLiveOidcSession()
    }
  }, [oidc.isUserLoggedIn])

  const cachedUser = !oidc.isUserLoggedIn ? getCachedAppUser() : null
  const hasCachedUser = cachedUser !== null

  useEffect(() => {
    if (oidc.isUserLoggedIn || hasCachedUser) return
    try {
      const oidcState = getOidcSpaAuthState()
      if (oidcState?.includes('explicitly logged out')) return
      consumeAuthFallbackFlag()
    } catch { /* storage unavailable */ }
  }, [oidc.isUserLoggedIn, hasCachedUser])

  const user = oidc.isUserLoggedIn
    ? {
        name: dbUser?.name || oidc.decodedIdToken.name,
        email: oidc.decodedIdToken.email,
        image: dbUser?.image || oidc.decodedIdToken.picture,
      }
    : cachedUser
      ? {
          name: cachedUser.name,
          email: cachedUser.email,
          image: cachedUser.picture,
        }
    : undefined

  return (
    <>
      <Header user={user} />
      <ResponsiveShell user={user}>
        <Outlet />
      </ResponsiveShell>
      <Toaster />
      <DiagnosticsGate />
    </>
  )
}
