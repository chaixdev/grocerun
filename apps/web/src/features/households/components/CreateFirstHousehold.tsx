"use client"

import { Button } from "@/components/ui/button"
import { Home, Loader2 } from "lucide-react"
import { useCreateDefaultHousehold } from "../hooks/useHouseholds"

export function CreateFirstHousehold() {
    const createDefault = useCreateDefaultHousehold()

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
            <Button onClick={() => createDefault.mutate()} disabled={createDefault.isPending}>
                {createDefault.isPending ? (
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
