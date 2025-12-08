"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Trash2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { updateStore } from "@/actions/store"
import { StoreSchema } from "@/schemas/store"
import { toast } from "sonner"

interface StoreSettingsFormProps {
    store: {
        id: string
        name: string
        location: string | null
        imageUrl: string | null
        householdId: string
    }
}

export function StoreSettingsForm({ store }: StoreSettingsFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const form = useForm<z.infer<typeof StoreSchema>>({
        resolver: zodResolver(StoreSchema),
        defaultValues: {
            name: store.name,
            location: store.location || "",
            imageUrl: store.imageUrl || "",
            householdId: store.householdId,
        },
    })

    function onSubmit(data: z.infer<typeof StoreSchema>) {
        startTransition(async () => {
            try {
                await updateStore(store.id, data)
                toast.success("Store updated successfully")
                router.refresh()
                router.push("/stores")
            } catch (error) {
                toast.error("Failed to update store")
                console.error(error)
            }
        })
    }



    return (
        <div className="space-y-8">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Store Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Costco downtown" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="address or area" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Image URL (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Form>

        </div>
    )
}
