
import { useRouter } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Save } from "lucide-react"

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
import { UpdateStoreSchema } from "@grocerun/dto"
import { useUpdateStore, type Store } from "../../hooks/useStore"

interface StoreSettingsFormProps {
    store: Store
}

export function StoreSettingsForm({ store }: StoreSettingsFormProps) {
    const router = useRouter()
    const updateStore = useUpdateStore(store.id, {
        onSuccess: () => router.navigate({ to: "/stores" }),
    })

    const form = useForm<z.infer<typeof UpdateStoreSchema>>({
        resolver: zodResolver(UpdateStoreSchema),
        defaultValues: {
            name: store.name,
            location: store.location || "",
            imageUrl: store.imageUrl || "",
        },
    })

    function onSubmit(data: z.infer<typeof UpdateStoreSchema>) {
        updateStore.mutate(data)
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
                        <Button type="submit" disabled={updateStore.isPending}>
                            {updateStore.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
