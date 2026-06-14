import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router"
import { Outlet, useParams, Link, useRouterState } from "@tanstack/react-router"
import { enforceLogin } from "@/core/auth/oidc"
import { SectionForm } from "@/features/stores/components/SectionForm"
import { SectionList } from "@/features/stores/components/SectionList"
import { useStore } from "@/features/stores/hooks/useStore"
import { StoreLists } from "@/features/lists/components/StoreLists"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"

export const Route = createFileRoute("/stores_/$storeId")({
  beforeLoad: enforceLogin,
  component: lazyRouteComponent(() => import("./stores_.$storeId"), "StoreDetailsPage"),
})

export function StoreDetailsPage() {
    const { storeId } = useParams({ from: "/stores_/$storeId" })
    const { data: store, isLoading, error } = useStore(storeId)
    const pathname = useRouterState({ select: (s) => s.location.pathname })

    if (isLoading) return <PageLoading />

    if (error || !store) {
        return (
            <div className="container py-10 text-center text-muted-foreground">
                Store not found.
            </div>
        )
    }

    // Layout switching: when a child route (e.g., settings) is active,
    // render only <Outlet /> — the child owns the full page. Without this,
    // TanStack Router would render both the parent content AND the outlet.
    const hasActiveChild = pathname !== `/stores/${storeId}`

    if (hasActiveChild) return <Outlet />

    return (
        <div className="container py-10 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/stores">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{store.name}</h2>
                    <p className="text-muted-foreground">
                        {store.location || "No location set"}
                    </p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Sections (Aisles)</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Define the sections of this store in the order you encounter them.
                        Drag to reorder.
                    </p>
                    <SectionForm storeId={store.id} />
                    <SectionList storeId={store.id} />
                </div>

                <div className="space-y-4">
                    <StoreLists storeId={store.id} />
                </div>
            </div>
        </div>
    )
}
