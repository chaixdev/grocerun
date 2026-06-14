
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useCreateHousehold, useRenameHousehold } from "../hooks/useHouseholds"
import { CreateHouseholdSchema } from "@grocerun/dto"

const formSchema = CreateHouseholdSchema

interface HouseholdFormProps {
    household?: { id: string; name: string }
    trigger?: React.ReactNode
}

export function HouseholdForm({ household, trigger }: HouseholdFormProps) {
    const [open, setOpen] = useState(false)
    const createHousehold = useCreateHousehold()
    const renameHousehold = useRenameHousehold()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: household?.name || "",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        const callbacks = {
            onSuccess: () => {
                setOpen(false)
                form.reset()
            },
        }

        if (household) {
            renameHousehold.mutate({ householdId: household.id, name: values.name }, callbacks)
        } else {
            createHousehold.mutate(values, callbacks)
        }
    }

    const isPending = createHousehold.isPending || renameHousehold.isPending

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Household
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{household ? "Edit Household" : "New Household"}</DialogTitle>
                    <DialogDescription>
                        {household ? "Rename your household." : "Create a new household to share lists."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="My Family" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Saving..." : "Save changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
