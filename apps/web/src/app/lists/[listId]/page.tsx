"use client"

import { useParams } from "next/navigation"
import { useListDetail } from "@/features/lists/hooks/useLists"
import { ListEditor } from "@/features/lists"
import { PageLoading } from "@/components/ui/page-loading"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ScrollText } from "lucide-react"
import Link from "next/link"

export default function ListDetailsPage() {
    const { listId } = useParams<{ listId: string }>()
    const { data: list, isLoading, error } = useListDetail(listId)

    if (isLoading) return <PageLoading />

    if (error || !list) {
        return (
            <div className="container py-10 max-w-2xl mx-auto text-center">
                <p className="text-muted-foreground">List not found.</p>
                <Button variant="ghost" asChild className="mt-4">
                    <Link href="/lists">Back to Lists</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="container py-10 space-y-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/lists">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight leading-tight">
                        {list.store.name}
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
                            <ScrollText className="h-3 w-3" />
                            <span>List</span>
                        </span>
                        <span className="text-muted-foreground/40">&bull;</span>
                        <span suppressHydrationWarning>{new Date(list.updatedAt).toLocaleDateString()}</span>
                        <span className="text-muted-foreground/40">&bull;</span>
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
