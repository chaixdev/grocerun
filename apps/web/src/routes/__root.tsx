import { useState, useEffect } from 'react'
import { Outlet, createRootRoute, Link } from '@tanstack/react-router'
import { Header } from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'
import { ResponsiveShell } from '@/components/layout/responsive-shell'
import { Toaster } from '@/components/ui/sonner'
import { DiagnosticsGate } from '@/components/diagnostics-gate'
import { PageLoading } from '@/components/ui/page-loading'
import { ErrorComponent } from '@/components/error-boundary'
import { bootstrapOidc, useOidc, OidcInitializationGate } from '@/core/auth/oidc'
import { getCachedAppUser, persistLiveOidcSession } from '@/core/auth/session'
import { consumeAuthFallbackFlag, markAuthFallbackAvailable } from '@/core/auth/token-cache'

const TEST_TOKEN_KEY = '__grocerun_test_token__'
const isTestMode = typeof window !== 'undefined'
  && (() => { try { return sessionStorage.getItem(TEST_TOKEN_KEY) !== null } catch { return false } })()

declare global {
  interface Window {
    __GROCERUN_CONFIG__?: {
      clientId: string;
      clientSecret: string;
    };
  }
}

const oidcConfig = window.__GROCERUN_CONFIG__ ?? {
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
  clientSecret: import.meta.env.VITE_OIDC_CLIENT_SECRET,
};

if (isTestMode) {
  console.log('[grocerun] Test mode detected — bootstrapping OIDC with mock implementation')
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
        implementation: "real",
        issuerUri: "https://accounts.google.com",
        clientId: oidcConfig.clientId,
        __unsafe_clientSecret: oidcConfig.clientSecret,
        __unsafe_useIdTokenAsAccessToken: true,
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

const ISSUER_URI = 'https://accounts.google.com'

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

  // If oidc-spa's session restoration failed (e.g. the preRedirectHook
  // cleared the localStorage flag before a redirect that didn't complete
  // on mobile), this backup flag gives us a second chance — but only if
  // the token cache is also empty (otherwise the cached token is sufficient).
  const [shouldRetry] = useState(() => {
    if (oidc.isUserLoggedIn) return false
    try {
      // Don't retry if the user explicitly logged out
      const oidcState = getOidcSpaAuthState()
      if (oidcState?.includes('explicitly logged out')) return false
      // Don't retry if we already have a valid cached token from the last session
      if (getCachedAppUser()) return false
      return consumeAuthFallbackFlag()
    } catch { /* storage unavailable */ }
    return false
  })

  // Persist backup flag when successfully logged in
  useEffect(() => {
    if (oidc.isUserLoggedIn) {
      markAuthFallbackAvailable()
      void persistLiveOidcSession()
    }
  }, [oidc.isUserLoggedIn])

  const cachedUser = !oidc.isUserLoggedIn ? getCachedAppUser() : null
  const user = oidc.isUserLoggedIn
    ? {
        name: oidc.decodedIdToken.name,
        email: oidc.decodedIdToken.email,
        image: oidc.decodedIdToken.picture,
      }
    : cachedUser
      ? {
          name: cachedUser.name,
          email: cachedUser.email,
          image: cachedUser.picture,
        }
    : undefined

  if (shouldRetry) {
    return <PageLoading />
  }

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
