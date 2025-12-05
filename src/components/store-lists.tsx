"use client"

import { useState } from "react"
import { createList } from "@/actions/list"
import { Button } from "@/components/ui/button"
import { Plus, ShoppingCart, ChevronDown, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface List {
    id: string
    name: string
    createdAt: Date
    _count: { items: number }
    status: string
}

export function StoreLists({ lists, storeId }: { lists: List[], storeId: string }) {
    const [isCreating, setIsCreating] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const activeLists = lists.filter(l => l.status !== "COMPLETED")
    const completedLists = lists.filter(l => l.status === "COMPLETED")

    const handleCreate = async () => {
        try {
            setIsCreating(true)
            const list = await createList({ storeId })
            // toast.success("List created") - Removed to speed up perceived navigation
            router.push(`/dashboard/lists/${list.id}`)
        } catch {
            toast.error("Failed to create list")
            setIsCreating(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Active Runs</h3>
                    <Button onClick={handleCreate} disabled={isCreating} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New List
                    </Button>
                </div>

                {activeLists.length === 0 ? (
                    <div className="text-center p-8 border rounded-lg border-dashed text-muted-foreground">
                        No active runs. Start a new trip!
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {activeLists.map(list => (
                            <Link key={list.id} href={`/dashboard/lists/${list.id}`}>
                                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                    <CardHeader className="p-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <ShoppingCart className="h-4 w-4 text-primary" />
                                                {list.name}
                                            </CardTitle>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(list.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <CardDescription>
                                            {list._count.items} items
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {completedLists.length > 0 && (
                <Collapsible
                    open={isOpen}
                    onOpenChange={setIsOpen}
                    className="space-y-2"
                >
                    <div className="flex items-center justify-between px-1">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Archived Runs ({completedLists.length})
                        </h4>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-9 p-0">
                                {isOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                                <span className="sr-only">Toggle</span>
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="space-y-2">
                        {completedLists.map(list => (
                            <Link key={list.id} href={`/dashboard/lists/${list.id}`}>
                                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                        <span className="font-medium text-muted-foreground line-through decoration-muted-foreground/30">
                                            {list.name}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(list.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            )}
        </div>
    )
}
