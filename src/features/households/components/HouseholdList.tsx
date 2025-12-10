"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { deleteHousehold } from "@/actions/household"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { HouseholdForm } from "./HouseholdForm"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-medium leading-none">
                                {household.name}
                            </CardTitle>
                            <CardDescription>
                                Created on {new Date(household.createdAt).toLocaleDateString()}
                            </CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 -mr-2 -mt-2 text-muted-foreground"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <HouseholdForm
                                    household={household}
                                    trigger={
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit Household
                                        </DropdownMenuItem>
                                    }
                                />
                                <form
                                    action={async () => {
                                        await deleteHousehold(household.id)
                                    }}
                                >
                                    <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
                                        <button className="w-full flex items-center cursor-pointer">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Household
                                        </button>
                                    </DropdownMenuItem>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}
