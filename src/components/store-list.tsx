"use client"

import { useState } from "react"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface Store {
    id: string
    name: string
    location: string | null
}

export function StoreList({ stores }: { stores: Store[] }) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [storeToDelete, setStoreToDelete] = useState<Store | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDeleteClick = (e: React.MouseEvent, store: Store) => {
        e.preventDefault()
        e.stopPropagation()
        setStoreToDelete(store)
        setDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!storeToDelete) return

        setIsDeleting(true)
        try {
            await deleteStore(storeToDelete.id)
            toast.success("Store deleted")
        } catch {
            toast.error("Failed to delete store")
        } finally {
            setIsDeleting(false)
            setDeleteDialogOpen(false)
            setStoreToDelete(null)
        }
    }

    if (stores.length === 0) {
        return (
            <div className="text-center p-8 border rounded-lg border-dashed text-muted-foreground">
                No stores found. Add one to get started.
            </div>
        )
    }

    return (
        <>
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
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive cursor-pointer"
                                            onClick={(e) => handleDeleteClick(e, store)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Store
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Store</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{storeToDelete?.name}"? This action cannot be undone and will remove all associated lists and items.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

