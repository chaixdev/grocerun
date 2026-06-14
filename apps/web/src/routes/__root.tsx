import { Outlet, createRootRoute, Link } from '@tanstack/react-router'
import { Header } from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'
import { ResponsiveShell } from '@/components/layout/responsive-shell'
import { Toaster } from '@/components/ui/sonner'
import { DiagnosticsGate } from '@/components/diagnostics-gate'
import { PageLoading } from '@/components/ui/page-loading'
import { ErrorComponent } from '@/components/error-boundary'
import { bootstrapOidc, useOidc, OidcInitializationGate } from '@/core/auth/oidc'

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

bootstrapOidc({
    implementation: "real",
    issuerUri: "https://accounts.google.com",
    clientId: oidcConfig.clientId,
    __unsafe_clientSecret: oidcConfig.clientSecret,
    __unsafe_useIdTokenAsAccessToken: true,
    BASE_URL: import.meta.env.BASE_URL,
    scopes: ["profile", "email"],
})

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
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <OidcInitializationGate fallback={<PageLoading />}>
        <AuthenticatedShell />
      </OidcInitializationGate>
    </ThemeProvider>
  )
}

function AuthenticatedShell() {
  const oidc = useOidc()

  const user = oidc.isUserLoggedIn
    ? {
        name: oidc.decodedIdToken.name,
        email: oidc.decodedIdToken.email,
        image: oidc.decodedIdToken.picture,
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
