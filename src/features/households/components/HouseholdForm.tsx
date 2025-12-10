"use client"

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
import { createHousehold, renameHousehold } from "@/actions/household"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
})

interface HouseholdFormProps {
    household?: { id: string; name: string }
    trigger?: React.ReactNode
}

export function HouseholdForm({ household, trigger }: HouseholdFormProps) {
    const [open, setOpen] = useState(false)
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: household?.name || "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if (household) {
                const result = await renameHousehold({ householdId: household.id, name: values.name })
                if (result.success) {
                    toast.success("Household updated")
                    setOpen(false)
                    form.reset()
                } else {
                    toast.error(result.error || "Failed to update household")
                }
            } else {
                const result = await createHousehold(values)
                if (result.success) {
                    toast.success("Household created")
                    setOpen(false)
                    form.reset()
                } else {
                    toast.error(result.error || "Failed to create household")
                }
            }
        } catch (error) {
            console.error("Failed to save household", error)
            toast.error("Failed to save household")
        }
    }

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
                            <Button type="submit">Save changes</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
