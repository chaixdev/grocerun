import { auth } from "@/core/auth"
import { getList } from "@/actions/list"
import { notFound, redirect } from "next/navigation"
import { ListEditor } from "@/features/lists"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, ShoppingCart, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default async function ListDetailsPage({
    params,
}: {
    params: Promise<{ listId: string }>
}) {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const { listId } = await params
    const list = await getList(listId)
    if (!list) notFound()

    return (
        <div className="container py-10 space-y-8 max-w-2xl mx-auto">
            <div className="flex items-start gap-4 justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/lists">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight leading-tight">
                            {list.store.name} shopping list
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {list.status === "PLANNING" && (
                                <>
                                    <Pencil className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-primary">Planning Mode</span>
                                </>
                            )}
                            {list.status === "SHOPPING" && (
                                <>
                                    <ShoppingCart className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-primary">Shopping Mode</span>
                                </>
                            )}
                            {list.status === "COMPLETED" && (
                                <>
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-primary">Completed</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ListEditor list={list} />
        </div>
    )
}
