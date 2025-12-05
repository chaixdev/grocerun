import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { verifyStoreAccess } from "@/lib/auth-helpers"
import { getSections } from "@/actions/section"
import { SectionList } from "@/components/section-list"
import { SectionForm } from "@/components/section-form"
import { StoreLists } from "@/components/store-lists"
import { getLists } from "@/actions/list"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function StoreDetailsPage({
    params,
}: {
    params: { storeId: string }
}) {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const hasAccess = await verifyStoreAccess(session.user.id, params.storeId)
    if (!hasAccess) notFound()

    const store = await prisma.store.findUnique({
        where: { id: params.storeId },
    })

    if (!store) notFound()

    const sections = await getSections(params.storeId)
    const lists = await getLists(params.storeId)

    return (
        <div className="container py-10 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/stores">
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
                    <SectionList sections={sections} storeId={store.id} />
                </div>

                <div className="space-y-4">
                    <StoreLists lists={lists} storeId={store.id} />
                </div>
            </div>
        </div>
    )
}
