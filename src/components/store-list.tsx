"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { deleteStore } from "@/actions/store"
import { Trash2 } from "lucide-react"
import Link from "next/link"

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
                <Card key={store.id}>
                    <CardHeader>
                        <Link href={`/dashboard/stores/${store.id}`} className="hover:underline">
                            <CardTitle>{store.name}</CardTitle>
                        </Link>
                        <CardDescription>{store.location || "No location"}</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-end">
                        <form
                            action={async () => {
                                await deleteStore(store.id)
                            }}
                        >
                            <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
