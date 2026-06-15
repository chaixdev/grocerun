import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router"
import { useParams, Link } from "@tanstack/react-router"
import { enforceAppLogin } from "@/core/auth/guard"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageLoading } from "@/components/ui/page-loading"
import { SectionList } from "@/features/stores/components/SectionList"
import { StoreDeleteSection, StoreSettingsForm } from "@/features/stores/components/StoreSettings"
import { useStore } from "@/features/stores/hooks/useStore"

export const Route = createFileRoute("/stores_/$storeId/settings")({
  beforeLoad: enforceAppLogin,
  component: lazyRouteComponent(() => import("./stores_.$storeId.settings"), "StoreSettingsPage"),
})

export function StoreSettingsPage() {
    const { storeId } = useParams({ from: "/stores_/$storeId/settings" })
    const { data: store, isLoading, isError } = useStore(storeId)

    if (isLoading) return <PageLoading />

    if (isError || !store) {
        return (
            <div className="container max-w-2xl mx-auto py-8 px-4">
                <p className="text-muted-foreground">Store not found.</p>
            </div>
        )
    }

    return (
        <div className="container max-w-2xl mx-auto py-8 px-4 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/stores">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Stores</span>
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Store Settings</h1>
                    <p className="text-muted-foreground">
                        Manage details for {store.name}
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="p-6 border rounded-lg bg-card">
                    <h2 className="text-lg font-semibold mb-4">Store Details</h2>
                    <StoreSettingsForm store={store} />
                </div>

                <div className="p-6 border rounded-lg bg-card">
                    <h2 className="text-lg font-semibold mb-4">Sections (Aisles)</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Order your sections to match the store layout.
                    </p>
                    <SectionList storeId={storeId} />
                </div>

                <div className="p-6 border border-destructive/20 rounded-lg bg-destructive/5">
                    <StoreDeleteSection storeId={store.id} storeName={store.name} />
                </div>
            </div>
        </div>
    )
}
