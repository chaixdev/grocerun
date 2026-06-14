"use client"

import { useStore } from "@/features/stores"
import { SectionList } from "@/features/stores"
import { SectionForm } from "@/features/stores"
import { StoreLists } from "@/features/lists"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { PageLoading } from "@/components/ui/page-loading"

export default function StoreDetailsPage() {
    const { storeId } = useParams<{ storeId: string }>()
    const { data: store, isLoading, error } = useStore(storeId)

    if (isLoading) return <PageLoading />

    if (error || !store) {
        return (
            <div className="container py-10 text-center text-muted-foreground">
                Store not found.
            </div>
        )
    }

    return (
        <div className="container py-10 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/stores">
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
