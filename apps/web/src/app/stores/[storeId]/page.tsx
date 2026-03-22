import { auth } from "@/core/auth"
import { verifyStoreAccess } from "@/core/auth"
import { getSections } from "@/actions/section"
import { SectionList } from "@/features/stores"
import { SectionForm } from "@/features/stores"
import { StoreLists } from "@/features/lists"
import { getLists } from "@/actions/list"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/core/lib/api-client"
import { SignJWT } from "jose"
import { z } from "zod"

const StoreResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    location: z.string().nullable(),
    imageUrl: z.string().nullable(),
    householdId: z.string(),
})

export default async function StoreDetailsPage({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const { storeId } = await params
    try {
        await verifyStoreAccess(storeId, session.user.id)
    } catch {
        notFound()
    }

    const token = (session as any).accessToken
    if (!token?.sub) redirect("/login")

    let store: z.infer<typeof StoreResponseSchema> | null = null
    try {
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
        const jwt = await new SignJWT(token)
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret)

        store = await apiClient.get(`/stores/${storeId}`, StoreResponseSchema, jwt)
    } catch {
        notFound()
    }

    if (!store) notFound()

    const sections = await getSections(storeId)
    const lists = await getLists(storeId)

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
                    <SectionList sections={sections} storeId={store.id} />
                </div>

                <div className="space-y-4">
                    <StoreLists lists={lists} storeId={store.id} />
                </div>
            </div>
        </div>
    )
}
