import { auth } from "@/auth"
import { getList } from "@/actions/list"
import { notFound, redirect } from "next/navigation"
import { ListEditor } from "@/components/list-editor"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
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
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/stores/${list.storeId}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{list.name}</h2>
                    <p className="text-muted-foreground">
                        {list.store.name}
                    </p>
                </div>
            </div>

            <ListEditor list={list} />
        </div>
    )
}
