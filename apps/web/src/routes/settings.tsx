import { createFileRoute, lazyRouteComponent, redirect } from "@tanstack/react-router"
import { useAuth, requireAuth } from "@/core/auth"
import { PageLoading } from "@/components/ui/page-loading"
import { Button } from "@/components/ui/button"
import { SettingsForm } from "@/components/settings-form"
import { useSettingsHouseholds } from "@/features/households/hooks/useInvitations"
import { useCurrentUser } from "@/hooks/useProfile"

const INVITATION_TIMEOUT_MINUTES = Number(import.meta.env.VITE_INVITATION_TIMEOUT_MINUTES) || 1440

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  component: lazyRouteComponent(() => import("./settings"), "SettingsPage"),
})

export function SettingsPage() {
    const { isAuthenticated } = useAuth()
    const { data: households, isLoading: householdsLoading } = useSettingsHouseholds()
    const { data: user, isLoading: userLoading, isError } = useCurrentUser()

    if (!isAuthenticated) throw redirect({ to: '/login' })

    if (householdsLoading || userLoading) return <PageLoading />

    if (isError || !user) {
      return (
        <div className="container max-w-2xl py-10 space-y-4">
          <p className="text-destructive">
            Failed to load user profile. Please try again.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )
    }

    return (
        <div className="container max-w-2xl py-10 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>
            <SettingsForm
                user={user}
                households={households ?? []}
                invitationTimeoutMinutes={INVITATION_TIMEOUT_MINUTES}
            />
            <div className="text-center text-xs text-muted-foreground pt-8">
                v{import.meta.env.VITE_APP_VERSION}
                {import.meta.env.VITE_BUILD_TIME && (
                    <> &middot; {new Date(import.meta.env.VITE_BUILD_TIME).toLocaleString()}</>
                )}
            </div>
        </div>
    )
}
