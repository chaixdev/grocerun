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
        setIsCreating(true)
        const result = await createList({ storeId })
        if (result.success) {
            // toast.success("List created") - Removed to speed up perceived navigation
            router.push(`/lists/${result.data.id}`)
        } else {
            toast.error(result.error || "Failed to create list")
            setIsCreating(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Active Runs</h3>
                    <Button onClick={handleCreate} disabled={isCreating || activeLists.length > 0} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New List
                    </Button>
                </div>

                {activeLists.length === 0 ? (
                    <div className="text-center p-8 border rounded-lg border-dashed text-muted-foreground bg-muted/10">
                        No active runs. Start a new trip!
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {activeLists.map(list => (
                            <Link key={list.id} href={`/lists/${list.id}`}>
                                <Card className="group hover:border-primary/50 transition-all cursor-pointer shadow-none border bg-card">
                                    <CardHeader className="p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                    <ShoppingCart className="h-4 w-4" />
                                                </div>
                                                <CardTitle className="text-sm font-medium leading-none">
                                                    {list.name}
                                                </CardTitle>
                                            </div>
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded-sm">
                                                {formatDistanceToNow(new Date(list.createdAt))}
                                            </span>
                                        </div>
                                        <CardDescription className="text-xs pl-10">
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
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="flex w-full items-center justify-between p-2 hover:bg-muted/50 rounded-lg group">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Archived Runs ({completedLists.length})
                            </h4>
                            {isOpen ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                            )}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2">
                        {completedLists.map(list => (
                            <Link key={list.id} href={`/lists/${list.id}`}>
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
