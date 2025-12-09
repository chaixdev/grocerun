"use client"

import { useState } from "react"
import { MapPin, Settings, Store as StoreIcon, ArrowRight, Eye, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createList } from "@/actions/list"
import { toast } from "sonner"
import type { DirectoryStore } from "@/actions/store-directory"

interface StoreCardProps {
    store: DirectoryStore
}

export function StoreCard({ store }: StoreCardProps) {
    const router = useRouter()
    const [isCreating, setIsCreating] = useState(false)

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
                        <div className="flex items-center gap-1 -mr-2 -mt-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/stores/${store.id}`)
                                }}
                                title="View Store Details"
                            >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View Store Details</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
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
                </div>

                <div className="mt-6 pt-4 border-t border-border/50">
                    {store.activeListId ? (
                        <Button
                            size="default"
                            className="w-full font-medium shadow-sm hover:shadow-md transition-all active:scale-[0.98] bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                            onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/lists/${store.activeListId}`)
                            }}
                        >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Go To List
                        </Button>
                    ) : (
                        <Button
                            size="default"
                            className="w-full font-medium shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                            disabled={isCreating}
                            onClick={async (e) => {
                                e.stopPropagation()
                                setIsCreating(true)
                                try {
                                    const newList = await createList({ storeId: store.id })
                                    router.push(`/lists/${newList.id}`)
                                } catch (error) {
                                    setIsCreating(false)
                                    console.error("Failed to create list:", error)
                                    toast.error("Failed to start shopping list")
                                }
                            }}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Start Shopping List"
                            )}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card >
    )
}
