import { auth } from "@/core/auth"
import { getList } from "@/actions/list"
import { notFound, redirect } from "next/navigation"
import { ListEditor } from "@/features/lists"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ScrollText } from "lucide-react"
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
                    <Link href="/lists">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <ScrollText className="h-5 w-5 text-muted-foreground" />
                        <h1 className="text-2xl font-bold tracking-tight leading-tight">
                            {list.store.name}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 ml-7">
                        {list.status === "PLANNING" && (
                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider border-primary/20 text-primary">
                                Planning
                            </Badge>
                        )}
                        {list.status === "SHOPPING" && (
                            <Badge variant="default" className="text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                Shopping
                            </Badge>
                        )}
                        {list.status === "COMPLETED" && (
                            <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider">
                                Completed
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <ListEditor list={list} />
        </div>
    )
}
