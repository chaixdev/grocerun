"use client"

import { MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface StoreCardProps {
    store: {
        id: string
        name: string
        location: string | null
    }
}

export function StoreCard({ store }: StoreCardProps) {
    const router = useRouter()

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col justify-between h-full bg-card/50">
                <div className="space-y-1">
                    <h3 className="font-semibold tracking-tight truncate">{store.name}</h3>
                    {store.location && (
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{store.location}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-4">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs"
                        onClick={() => router.push(`/stores/${store.id}/lists/new`)}
                    >
                        Start List
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
