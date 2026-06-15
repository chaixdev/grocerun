import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router"
import { enforceAppLogin } from "@/core/auth/guard"
import { PageLoading } from "@/components/ui/page-loading"
import { HouseholdForm, HouseholdList } from "@/features/households"
import { useHouseholds } from "@/features/households/hooks/useHouseholds"

export const Route = createFileRoute("/households")({
  beforeLoad: enforceAppLogin,
  component: lazyRouteComponent(() => import("./households"), "HouseholdsPage"),
})

export function HouseholdsPage() {
    const { data: households, isLoading } = useHouseholds()

    if (isLoading) return <PageLoading />

    return (
        <div className="container py-10 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Households</h2>
                    <p className="text-muted-foreground">
                        Manage your households and shared lists.
                    </p>
                </div>
                <HouseholdForm />
            </div>
            <HouseholdList households={households ?? []} />
        </div>
    )
}
