"use client"

import { useState } from "react"
import { createList } from "@/actions/list"
import { Button } from "@/components/ui/button"
import { Plus, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface List {
    id: string
    name: string
    createdAt: Date
    _count: { items: number }
    status: string
}

export function StoreLists({ lists, storeId }: { lists: List[], storeId: string }) {
    const [isCreating, setIsCreating] = useState(false)
    const router = useRouter()

    const handleCreate = async () => {
        try {
            setIsCreating(true)
            const list = await createList({ storeId })
            toast.success("List created")
            router.push(`/dashboard/lists/${list.id}`)
        } catch {
            toast.error("Failed to create list")
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Shopping Lists</h3>
                <Button onClick={handleCreate} disabled={isCreating} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New List
                </Button>
            </div>

            {lists.length === 0 ? (
                <div className="text-center p-8 border rounded-lg border-dashed text-muted-foreground">
                    No lists yet. Start a new trip!
                </div>
            ) : (
                <div className="grid gap-4">
                    {lists.map(list => (
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
                                        {list._count.items} items • {list.status}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
