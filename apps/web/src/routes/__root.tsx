import { useEffect, useState } from 'react'
import { Outlet, createRootRoute, Link } from '@tanstack/react-router'
import { Header } from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'
import { ResponsiveShell } from '@/components/layout/responsive-shell'
import { Toaster } from '@/components/ui/sonner'
import { DiagnosticsGate } from '@/components/diagnostics-gate'
import { PageLoading } from '@/components/ui/page-loading'
import { ErrorComponent } from '@/components/error-boundary'
import { bootstrapOidc, OidcInitializationGate, useAuth, isTestMode as checkTestMode } from '@/core/auth'
import { resolveOidcConfig } from '@/core/auth/oidc-config'
import { api } from '@/core/lib/api'

const isTestMode = typeof window !== 'undefined'
  && (() => { try { return checkTestMode() } catch { return false } })()

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

const { isGoogle, bootstrapConfig } = resolveOidcConfig(oidcConfig, {});

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

function AuthenticatedShell() {
  const { isAuthenticated, user: authUser } = useAuth()

  // Fetch DB user profile for avatar/name — prefers DB values over OIDC
  // token claims so that profile edits (e.g. updated avatar URL) are
  // reflected in the app bar.  Falls back to OIDC claims while loading
  // or if the API call fails.
  const [dbUser, setDbUser] = useState<{ name: string | null; image: string | null } | undefined>()
  useEffect(() => {
    if (!isAuthenticated || !authUser) {
      setDbUser(undefined)
      return
    }
    let cancelled = false
    api.get<{ name: string | null; image: string | null }>('/users/me')
      .then((u) => { if (!cancelled) setDbUser(u) })
      .catch((err) => { if (!cancelled) console.error('[grocerun] Failed to load DB user for app bar:', err) })
    return () => { cancelled = true }
  }, [isAuthenticated, authUser])

  // Session persistence + auth fallback flag are handled internally by
  // useAuth() — no need for a separate effect here.

  const user = isAuthenticated && authUser
    ? {
        name: dbUser?.name || authUser.name,
        email: authUser.email,
        image: dbUser?.image || authUser.picture,
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
