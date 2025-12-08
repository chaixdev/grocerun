import { notFound, redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

import { auth } from "@/auth"
import { getStore } from "@/actions/store"
import { getSections } from "@/actions/section"
import { Button } from "@/components/ui/button"
import { StoreSettingsForm } from "@/components/stores/StoreSettingsForm"
import { SectionList } from "@/components/section-list"

interface StoreSettingsPageProps {
    params: {
        storeId: string
    }
}

export default async function StoreSettingsPage({ params }: { params: Promise<{ storeId: string }> }) {
    const { storeId } = await params
    const session = await auth()
    if (!session?.user) redirect("/login")

    const store = await getStore(storeId)

    if (!store) {
        notFound()
    }

    return (
        <div className="container max-w-2xl mx-auto py-8 px-4 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/stores">
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
                    <SectionList
                        sections={await getSections(storeId)}
                        storeId={storeId}
                    />
                </div>
            </div>
        </div>
    )
}
