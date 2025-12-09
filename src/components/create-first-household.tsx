"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createDefaultHousehold } from "@/actions/store"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Home, Loader2 } from "lucide-react"

export function CreateFirstHousehold() {
    const [isCreating, setIsCreating] = useState(false)
    const router = useRouter()

    const handleCreate = async () => {
        setIsCreating(true)
        try {
            await createDefaultHousehold()
            toast.success("Household created!")
            router.refresh()
        } catch (error) {
            toast.error("Failed to create household")
            setIsCreating(false)
        }
    }

    return (
        <div className="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
            <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                    <Home className="h-8 w-8 text-primary" />
                </div>
            </div>
            <p className="text-lg font-medium">Welcome to Grocerun!</p>
            <p className="text-muted-foreground mt-1 mb-6">
                Create your first household to start managing stores.
            </p>
            <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                    </>
                ) : (
                    "Create My Household"
                )}
            </Button>
        </div>
    )
}
