"use client"

import { MapPin, Settings, Store as StoreIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getActiveListForStore, createList } from "@/actions/list"
import { toast } from "sonner"

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
        <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-secondary/5">
            <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <StoreIcon className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-bold text-lg tracking-tight truncate group-hover:text-primary transition-colors">
                                    {store.name}
                                </h3>
                            </div>
                            {store.location && (
                                <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{store.location}</span>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground -mr-2 -mt-2 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/stores/${store.id}/settings`)
                            }}
                            title="Store Settings"
                        >
                            <Settings className="h-4 w-4" />
                            <span className="sr-only">Store Settings</span>
                        </Button>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50">
                    <Button
                        size="default"
                        className="w-full font-medium shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                        onClick={async () => {
                            try {
                                const activeList = await getActiveListForStore(store.id)
                                if (activeList) {
                                    router.push(`/lists/${activeList.id}`)
                                } else {
                                    const newList = await createList({ storeId: store.id })
                                    router.push(`/lists/${newList.id}`)
                                }
                            } catch (error) {
                                console.error("Failed to check/create active list:", error)
                                toast.error("Failed to start shopping list")
                            }
                        }}
                    >
                        Start Shopping List
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
