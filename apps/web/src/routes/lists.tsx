import { useState } from "react"
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router"
import { enforceAppLogin } from "@/core/auth/guard"
import { PageLoading } from "@/components/ui/page-loading"
import { Button } from "@/components/ui/button"
import { HouseholdListGroup } from "@/features/lists"
import { useDashboard } from "@/features/lists/hooks/useDashboard"
import { resetRxDb } from "@/core/rxdb"
import { router } from "@/router"
import { RefreshCw } from "lucide-react"

export const Route = createFileRoute("/lists")({
  beforeLoad: enforceAppLogin,
  component: lazyRouteComponent(() => import("./lists"), "ListsPage"),
})

export function ListsPage() {
    const { data: households, isLoading, isError } = useDashboard()
    const [cleaningLists, setCleaningLists] = useState(false)

    if (isLoading) return <PageLoading />

    if (isError) {
        async function handleCleanAndResync() {
            if (!confirm('This will delete all local data and re-sync from the server. Continue?')) return
            setCleaningLists(true)
            await resetRxDb()
            router.navigate({ to: "/lists", replace: true })
        }

        return (
            <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
                <div className="p-8 border rounded-lg bg-destructive/10 border-destructive/20">
                    <h2 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-4">
                        We couldn&apos;t load your lists. Please try again later.
                    </p>
                    <Button
                        onClick={handleCleanAndResync}
                        variant="outline"
                        disabled={cleaningLists}
                        className="border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {cleaningLists ? "Cleaning..." : "Clean & resync"}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-xl font-bold tracking-tight">Lists</h1>
                <p className="text-muted-foreground">
                    Active shopping lists for your households.
                </p>
            </div>

            <div className="space-y-12">
                {!households || households.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
                        <p className="text-lg font-medium">No active lists found</p>
                        <p className="text-muted-foreground mt-1">
                            Start a new list in one of your stores to see it here.
                        </p>
                    </div>
                ) : (
                    households.map((household) => (
                        <HouseholdListGroup
                            key={household.id}
                            household={household}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
