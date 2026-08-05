import { createFileRoute, lazyRouteComponent, redirect } from '@tanstack/react-router'
import { useAuth, isAuthenticated } from '@/core/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: '/lists' })
    }
  },
  component: lazyRouteComponent(() => import('./login'), 'LoginPage'),
})

export function LoginPage() {
  // beforeLoad already redirected logged-in users.
  const { login, initializationError } = useAuth()

  const handleLogin = () => {
    login()
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      <div className="mx-auto grid w-[350px] gap-6">
        <div className="grid gap-2 text-center">
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="text-balance text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        {initializationError ? (
          <div className="p-4 border rounded-lg bg-destructive/10 text-destructive text-sm">
            Authentication service is unavailable. Please try again later.
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogin}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
          >
            Sign in
          </button>
        )}
      </div>
    </div>
  )
}
