import { useState } from "react"
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router"
import { z } from "zod"
import { enforceAppLogin } from "@/core/auth/guard"
import { PageLoading } from "@/components/ui/page-loading"
import { Button } from "@/components/ui/button"
import { HouseholdStoreGroup } from "@/features/stores"
import { CreateFirstHousehold } from "@/features/households"
import { useStoreDirectory } from "@/features/stores/hooks/useStoreDirectory"
import { resetRxDb } from "@/core/rxdb"
import { router } from "@/router"
import { RefreshCw } from "lucide-react"

export const Route = createFileRoute("/stores")({
  beforeLoad: enforceAppLogin,
  validateSearch: z.object({ householdId: z.string().optional() }),
  component: lazyRouteComponent(() => import("./stores"), "StoresPage"),
})

export function StoresPage() {
    const { data: households, isLoading, isError } = useStoreDirectory()
    const [cleaningStores, setCleaningStores] = useState(false)

    if (isLoading) return <PageLoading />

    if (isError) {
        async function handleCleanAndResync() {
            if (!confirm('This will delete all local data and re-sync from the server. Continue?')) return
            setCleaningStores(true)
            await resetRxDb()
            router.navigate({ to: "/lists", replace: true })
        }

        return (
            <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
                <div className="p-8 border rounded-lg bg-destructive/10 border-destructive/20">
                    <h2 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-4">
                        We couldn&apos;t load your stores. Please try again later.
                    </p>
                    <Button
                        onClick={handleCleanAndResync}
                        variant="outline"
                        disabled={cleaningStores}
                        className="border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {cleaningStores ? "Cleaning..." : "Clean & resync"}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-xl font-bold tracking-tight">Stores</h1>
                <p className="text-muted-foreground">
                    Manage your stores and start shopping lists.
                </p>
            </div>

            <div className="space-y-12">
                {!households || households.length === 0 ? (
                    <CreateFirstHousehold />
                ) : (
                    households.map((household) => (
                        <HouseholdStoreGroup
                            key={household.id}
                            household={household}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
