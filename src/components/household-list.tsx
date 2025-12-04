"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { deleteHousehold } from "@/actions/household"
import { Trash2, Pencil } from "lucide-react"
import { HouseholdForm } from "./household-form"

interface Household {
    id: string
    name: string
    createdAt: Date
}

export function HouseholdList({ households }: { households: Household[] }) {
    if (households.length === 0) {
        return (
            <div className="text-center p-8 border rounded-lg border-dashed text-muted-foreground">
                No households found. Create one to get started.
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {households.map((household) => (
                <Card key={household.id}>
                    <CardHeader>
                        <CardTitle>{household.name}</CardTitle>
                        <CardDescription>Created on {new Date(household.createdAt).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-end gap-2">
                        <HouseholdForm
                            household={household}
                            trigger={
                                <Button variant="outline" size="icon">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            }
                        />
                        <form
                            action={async () => {
                                await deleteHousehold(household.id)
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
