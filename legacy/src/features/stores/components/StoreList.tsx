"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { deleteStore } from "@/actions/store"
import { MoreHorizontal, Trash2 } from "lucide-react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Store {
    id: string
    name: string
    location: string | null
}

export function StoreList({ stores }: { stores: Store[] }) {
    if (stores.length === 0) {
        return (
            <div className="text-center p-8 border rounded-lg border-dashed text-muted-foreground">
                No stores found. Add one to get started.
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
                <Link key={store.id} href={`/stores/${store.id}`}>
                    <Card className="relative hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-medium leading-none">
                                    {store.name}
                                </CardTitle>
                                <CardDescription>
                                    {store.location || "No location"}
                                </CardDescription>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 -mr-2 -mt-2 text-muted-foreground"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <form
                                        action={async () => {
                                            await deleteStore(store.id)
                                        }}
                                    >
                                        <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
                                            <button className="w-full flex items-center cursor-pointer">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Store
                                            </button>
                                        </DropdownMenuItem>
                                    </form>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                    </Card>
                </Link>
            ))}
        </div>
    )
}
