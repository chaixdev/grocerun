"use client"

import { useSession } from "next-auth/react"
import { PageLoading } from "@/components/ui/page-loading"
import { SettingsForm } from "@/components/settings-form"
import { useSettingsHouseholds } from "@/features/households/hooks/useInvitations"

const INVITATION_TIMEOUT_MINUTES = Number(process.env.NEXT_PUBLIC_INVITATION_TIMEOUT_MINUTES) || 1440

export default function SettingsPage() {
    const { data: session, status } = useSession()
    const { data: households, isLoading: householdsLoading } = useSettingsHouseholds()

    if (status === "loading" || householdsLoading) return <PageLoading />

    if (!session?.user?.id) {
        return null // Auth middleware will redirect
    }

    const user = {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
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
                v{process.env.NEXT_PUBLIC_APP_VERSION}
            </div>
        </div>
    )
}
