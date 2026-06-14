"use client"

import { PageLoading } from "@/components/ui/page-loading"
import { HouseholdStoreGroup } from "@/features/stores"
import { CreateFirstHousehold } from "@/features/households"
import { useStoreDirectory } from "@/features/stores/hooks/useStoreDirectory"

export default function StoresPage() {
    const { data: households, isLoading, isError } = useStoreDirectory()

    if (isLoading) return <PageLoading />

    if (isError) {
        return (
            <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
                <div className="p-8 border rounded-lg bg-destructive/10 border-destructive/20">
                    <h2 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-4">
                        We couldn&apos;t load your stores. Please try again later.
                    </p>
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
