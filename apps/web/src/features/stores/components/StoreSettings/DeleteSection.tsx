"use client"

import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useDeleteStore } from "../../hooks/useStore"

interface StoreDeleteSectionProps {
    storeId: string
    storeName: string
}

export function StoreDeleteSection({ storeId, storeName }: StoreDeleteSectionProps) {
    const router = useRouter()
    const deleteStore = useDeleteStore(storeId, {
        onSuccess: () => router.push("/stores"),
    })

    return (
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                    Deleting this store will permanently remove it.
                </p>
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleteStore.isPending}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Store
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete
                            <span className="font-semibold"> {storeName} </span>
                            and remove all data associated with it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteStore.mutate()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteStore.isPending ? "Deleting..." : "Delete Store"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
