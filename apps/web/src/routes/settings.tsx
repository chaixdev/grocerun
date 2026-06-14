import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router"
import { useOidc, enforceLogin } from "@/core/auth/oidc"
import { PageLoading } from "@/components/ui/page-loading"
import { SettingsForm } from "@/components/settings-form"
import { useSettingsHouseholds } from "@/features/households/hooks/useInvitations"
import { useCurrentUser } from "@/hooks/useProfile"

const INVITATION_TIMEOUT_MINUTES = Number(import.meta.env.VITE_INVITATION_TIMEOUT_MINUTES) || 1440

export const Route = createFileRoute("/settings")({
  beforeLoad: enforceLogin,
  component: lazyRouteComponent(() => import("./settings"), "SettingsPage"),
})

export function SettingsPage() {
    const oidc = useOidc({ assert: "user logged in" })
    const { data: households, isLoading: householdsLoading } = useSettingsHouseholds()
    const { data: user, isLoading: userLoading } = useCurrentUser()

    if (!oidc.isUserLoggedIn || householdsLoading) return <PageLoading />

    // EnforceLogin guarantees auth; user should be available after loading.
    // If the API call hasn't resolved yet, show loading until it does.
    if (userLoading || !user) return <PageLoading />

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
